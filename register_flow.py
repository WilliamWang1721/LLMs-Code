"""
ChatGPT 注册流程模块
使用 Playwright 浏览器自动化完成 ChatGPT Free 账户注册
全程模拟人类操作
"""

import re
import json
import time
import random
import secrets
import hashlib
import base64
import asyncio
import urllib.parse
import urllib.request
import urllib.error
from typing import Optional, Dict, Any
from datetime import datetime

from config import (
    AUTH_URL, TOKEN_URL, CLIENT_ID,
    DEFAULT_REDIRECT_URI, DEFAULT_SCOPE,
    FIRST_NAMES, LAST_NAMES,
)
from email_pool import get_email_and_token, get_oai_code
from stealth_browser import StealthBrowser
from human_simulator import HumanSimulator


# ==========================================
# OAuth 辅助（复用 register.py 的逻辑）
# ==========================================

def _b64url_no_pad(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _sha256_b64url_no_pad(s: str) -> str:
    return _b64url_no_pad(hashlib.sha256(s.encode("ascii")).digest())


def _random_state(nbytes: int = 16) -> str:
    return secrets.token_urlsafe(nbytes)


def _pkce_verifier() -> str:
    return secrets.token_urlsafe(64)


def _jwt_claims_no_verify(id_token: str) -> Dict[str, Any]:
    if not id_token or id_token.count(".") < 2:
        return {}
    payload_b64 = id_token.split(".")[1]
    pad = "=" * ((4 - (len(payload_b64) % 4)) % 4)
    try:
        payload = base64.urlsafe_b64decode((payload_b64 + pad).encode("ascii"))
        return json.loads(payload.decode("utf-8"))
    except Exception:
        return {}


def _post_form(url: str, data: Dict[str, str], timeout: int = 30) -> Dict[str, Any]:
    body = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            if resp.status != 200:
                raise RuntimeError(
                    f"token exchange failed: {resp.status}: {raw.decode('utf-8', 'replace')}"
                )
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        raise RuntimeError(
            f"token exchange failed: {exc.code}: {raw.decode('utf-8', 'replace')}"
        ) from exc


def generate_oauth_url(
    *, redirect_uri: str = DEFAULT_REDIRECT_URI, scope: str = DEFAULT_SCOPE
) -> dict:
    state = _random_state()
    code_verifier = _pkce_verifier()
    code_challenge = _sha256_b64url_no_pad(code_verifier)

    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": scope,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "prompt": "login",
        "id_token_add_organizations": "true",
        "codex_cli_simplified_flow": "true",
    }
    auth_url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"
    return {
        "auth_url": auth_url,
        "state": state,
        "code_verifier": code_verifier,
        "redirect_uri": redirect_uri,
    }


def submit_callback_url(
    *,
    callback_url: str,
    expected_state: str,
    code_verifier: str,
    redirect_uri: str = DEFAULT_REDIRECT_URI,
) -> Optional[str]:
    """从 OAuth callback URL 中提取 code 并交换 token"""
    parsed = urllib.parse.urlparse(callback_url.strip())
    query = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)

    code = (query.get("code", [""])[0] or "").strip()
    state = (query.get("state", [""])[0] or "").strip()

    if not code:
        print("[Error] callback URL 中缺少 code 参数")
        return None
    if state != expected_state:
        print(f"[Error] state 不匹配: 期望 {expected_state[:20]}..., 收到 {state[:20]}...")
        return None

    try:
        token_resp = _post_form(
            TOKEN_URL,
            {
                "grant_type": "authorization_code",
                "client_id": CLIENT_ID,
                "code": code,
                "redirect_uri": redirect_uri,
                "code_verifier": code_verifier,
            },
        )
    except Exception as e:
        print(f"[Error] Token 交换失败: {e}")
        return None

    access_token = (token_resp.get("access_token") or "").strip()
    refresh_token = (token_resp.get("refresh_token") or "").strip()
    id_token = (token_resp.get("id_token") or "").strip()
    expires_in = int(token_resp.get("expires_in", 0))

    claims = _jwt_claims_no_verify(id_token)
    email = str(claims.get("email") or "").strip()
    auth_claims = claims.get("https://api.openai.com/auth") or {}
    account_id = str(auth_claims.get("chatgpt_account_id") or "").strip()

    now = int(time.time())
    expired_rfc3339 = time.strftime(
        "%Y-%m-%dT%H:%M:%SZ", time.gmtime(now + max(expires_in, 0))
    )
    now_rfc3339 = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now))

    config = {
        "id_token": id_token,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "account_id": account_id,
        "last_refresh": now_rfc3339,
        "email": email,
        "type": "codex",
        "expired": expired_rfc3339,
    }

    return json.dumps(config, ensure_ascii=False, separators=(",", ":"))


# ==========================================
# 核心注册流程（Playwright 浏览器自动化）
# ==========================================

class ChatGPTRegistrar:
    """ChatGPT 账户自动注册器"""

    def __init__(self, proxy_url: str = None, headless: bool = False):
        self.proxy_url = proxy_url
        self.headless = headless
        self.browser_mgr = StealthBrowser()
        self.human: Optional[HumanSimulator] = None
        self.page = None

    async def register_one(self) -> Optional[str]:
        """执行一次完整的注册流程，返回 token JSON 字符串"""
        proxies = None
        if self.proxy_url:
            proxies = {"http": self.proxy_url, "https": self.proxy_url}

        try:
            # 1. 获取临时邮箱
            print("[1/7] 获取临时邮箱...")
            email, mail_token = get_email_and_token(proxies)
            if not email or not mail_token:
                print("[Error] 获取邮箱失败")
                return None
            print(f"[✓] 邮箱: {email}")

            # 2. 生成 OAuth URL 和密码
            oauth = generate_oauth_url()
            password = secrets.token_urlsafe(18)
            rand_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            rand_year = random.randint(1990, 2004)
            rand_month = random.randint(1, 12)
            rand_day = random.randint(1, 28)
            rand_bday = f"{rand_year}-{rand_month:02d}-{rand_day:02d}"

            print(f"[*] 姓名: {rand_name}, 生日: {rand_bday}")

            # 3. 启动指纹浏览器
            print("[2/7] 启动指纹浏览器...")
            self.page = await self.browser_mgr.launch(
                proxy_url=self.proxy_url,
                headless=self.headless,
            )
            self.human = HumanSimulator(self.page)

            # 4. 导航到注册页面
            print("[3/7] 打开 ChatGPT 注册页面...")
            await self.page.goto(oauth["auth_url"], wait_until="domcontentloaded")
            await self.human.thinking_pause()

            # 模拟阅读页面
            await self.human.simulate_reading(random.uniform(1.5, 3.0))

            # 5. 输入邮箱
            print("[4/7] 输入注册邮箱...")
            result = await self._step_enter_email(email)
            if not result:
                return None

            # 6. 设置密码
            print("[5/7] 设置密码...")
            result = await self._step_set_password(password)
            if not result:
                return None

            # 7. 邮箱验证（如需要）
            print("[6/7] 等待邮箱验证...")
            result = await self._step_email_verification(mail_token, email, proxies)
            if not result:
                return None

            # 8. 填写个人信息
            print("[7/7] 填写个人信息...")
            result = await self._step_fill_profile(rand_name, rand_bday)
            if not result:
                return None

            # 9. 等待并捕获 OAuth callback
            print("[*] 等待 OAuth 回调...")
            token_json = await self._capture_oauth_callback(oauth)
            if token_json:
                print("[✓] 注册成功！Token 已获取")
                return token_json
            else:
                print("[Error] 未能捕获到 OAuth callback")
                return None

        except Exception as e:
            print(f"[Error] 注册流程异常: {e}")
            import traceback
            traceback.print_exc()
            return None
        finally:
            await self.browser_mgr.close()

    # ==========================================
    # 分步骤实现
    # ==========================================

    async def _step_enter_email(self, email: str) -> bool:
        """步骤：输入邮箱地址"""
        try:
            # 等待页面加载完成
            await self.page.wait_for_load_state("networkidle", timeout=15000)
            await self.human.random_wait(1.0, 2.5)

            # 查找邮箱输入框（尝试多种选择器）
            email_selectors = [
                'input[name="email"]',
                'input[type="email"]',
                'input[id="email"]',
                'input[name="username"]',
                'input[id="username"]',
                'input[autocomplete="email"]',
                'input[autocomplete="username"]',
            ]

            email_input = None
            for sel in email_selectors:
                try:
                    email_input = await self.page.wait_for_selector(sel, timeout=3000, state="visible")
                    if email_input:
                        break
                except Exception:
                    continue

            if not email_input:
                # 尝试通过按钮先进入注册模式
                signup_selectors = [
                    'text="Sign up"',
                    'text="Create account"',
                    'text="注册"',
                    'a[href*="signup"]',
                    'button:has-text("Sign up")',
                    '[data-testid="signup-button"]',
                ]
                for sel in signup_selectors:
                    try:
                        btn = await self.page.wait_for_selector(sel, timeout=3000, state="visible")
                        if btn:
                            await self.human.click_element_human(sel)
                            await self.human.thinking_pause()
                            break
                    except Exception:
                        continue

                # 再次尝试找邮箱输入框
                for sel in email_selectors:
                    try:
                        email_input = await self.page.wait_for_selector(sel, timeout=5000, state="visible")
                        if email_input:
                            break
                    except Exception:
                        continue

            if not email_input:
                print("[Error] 未找到邮箱输入框")
                # 打印页面内容用于调试
                title = await self.page.title()
                print(f"[Debug] 页面标题: {title}")
                print(f"[Debug] URL: {self.page.url}")
                return False

            # 人类化输入邮箱
            found_selector = None
            for sel in email_selectors:
                try:
                    el = await self.page.query_selector(sel)
                    if el:
                        found_selector = sel
                        break
                except Exception:
                    continue

            if found_selector:
                await self.human.type_with_mistakes(found_selector, email, mistake_rate=0.02)
            else:
                await email_input.click()
                await self.human.random_wait(0.3, 0.8)
                await self.page.keyboard.type(email, delay=random.randint(50, 150))

            await self.human.random_wait(0.5, 1.5)

            # 点击继续按钮
            continue_selectors = [
                'button[type="submit"]',
                'button:has-text("Continue")',
                'button:has-text("继续")',
                'button:has-text("Next")',
                'input[type="submit"]',
            ]
            for sel in continue_selectors:
                try:
                    btn = await self.page.wait_for_selector(sel, timeout=3000, state="visible")
                    if btn:
                        await self.human.click_element_human(sel)
                        break
                except Exception:
                    continue

            await self.human.thinking_pause()
            await self.page.wait_for_load_state("networkidle", timeout=15000)
            return True

        except Exception as e:
            print(f"[Error] 输入邮箱步骤失败: {e}")
            return False

    async def _step_set_password(self, password: str) -> bool:
        """步骤：设置密码"""
        try:
            await self.human.random_wait(1.0, 2.5)

            # 查找密码输入框
            pwd_selectors = [
                'input[name="password"]',
                'input[type="password"]',
                'input[id="password"]',
                'input[autocomplete="new-password"]',
            ]

            pwd_input = None
            found_selector = None
            for sel in pwd_selectors:
                try:
                    pwd_input = await self.page.wait_for_selector(sel, timeout=5000, state="visible")
                    if pwd_input:
                        found_selector = sel
                        break
                except Exception:
                    continue

            if not pwd_input:
                # 可能页面显示「已有账号」—— 检查是否需要切换到注册
                current_url = self.page.url
                print(f"[Debug] 密码页 URL: {current_url}")

                # 可能跳转到了登录页，需要找注册入口
                signup_link_selectors = [
                    'text="Sign up"',
                    'a[href*="signup"]',
                    'text="Create account"',
                ]
                for sel in signup_link_selectors:
                    try:
                        link = await self.page.wait_for_selector(sel, timeout=2000, state="visible")
                        if link:
                            await self.human.click_element_human(sel)
                            await self.human.thinking_pause()
                            break
                    except Exception:
                        continue

                # 再找密码框
                for sel in pwd_selectors:
                    try:
                        pwd_input = await self.page.wait_for_selector(sel, timeout=5000, state="visible")
                        if pwd_input:
                            found_selector = sel
                            break
                    except Exception:
                        continue

            if not pwd_input:
                print("[Error] 未找到密码输入框")
                return False

            # 人类化输入密码
            if found_selector:
                await self.human.type_text_human(found_selector, password)
            else:
                await pwd_input.click()
                await self.human.random_wait(0.3, 0.6)
                await self.page.keyboard.type(password, delay=random.randint(50, 150))

            await self.human.random_wait(0.5, 1.5)

            # 点击继续
            continue_selectors = [
                'button[type="submit"]',
                'button:has-text("Continue")',
                'button:has-text("继续")',
                'button:has-text("Create account")',
                'button:has-text("Sign up")',
            ]
            for sel in continue_selectors:
                try:
                    btn = await self.page.wait_for_selector(sel, timeout=3000, state="visible")
                    if btn:
                        await self.human.click_element_human(sel)
                        break
                except Exception:
                    continue

            await self.human.thinking_pause()
            await self.page.wait_for_load_state("networkidle", timeout=15000)
            return True

        except Exception as e:
            print(f"[Error] 设置密码步骤失败: {e}")
            return False

    async def _step_email_verification(self, mail_token: str, email: str, proxies: Any) -> bool:
        """步骤：邮箱验证码输入"""
        try:
            await self.human.random_wait(1.0, 2.0)

            # 检查当前页面是否需要邮箱验证
            current_url = self.page.url
            page_content = await self.page.content()

            # 判断是否在验证码页面
            needs_otp = (
                "verification" in current_url.lower()
                or "verify" in current_url.lower()
                or "otp" in current_url.lower()
                or "email-verification" in current_url.lower()
                or "验证码" in page_content
                or "verification code" in page_content.lower()
                or "enter the code" in page_content.lower()
            )

            if not needs_otp:
                # 尝试检查是否有 OTP 输入框
                otp_selectors = [
                    'input[name="code"]',
                    'input[name="otp"]',
                    'input[type="tel"]',
                    'input[autocomplete="one-time-code"]',
                    'input[inputmode="numeric"]',
                ]
                for sel in otp_selectors:
                    try:
                        el = await self.page.wait_for_selector(sel, timeout=2000, state="visible")
                        if el:
                            needs_otp = True
                            break
                    except Exception:
                        continue

            if not needs_otp:
                print("[*] 无需邮箱验证，跳过此步骤")
                return True

            print("[*] 需要邮箱验证，正在等待验证码...")

            # 轮询邮箱获取验证码
            seen_ids = set()
            otp_code = get_oai_code(mail_token, email, proxies, seen_msg_ids=seen_ids)

            if not otp_code:
                print("[Error] 未收到验证码")
                return False

            print(f"[✓] 收到验证码: {otp_code}")

            # 查找验证码输入框
            otp_selectors = [
                'input[name="code"]',
                'input[name="otp"]',
                'input[type="tel"]',
                'input[autocomplete="one-time-code"]',
                'input[inputmode="numeric"]',
            ]

            otp_input = None
            found_selector = None
            for sel in otp_selectors:
                try:
                    otp_input = await self.page.wait_for_selector(sel, timeout=3000, state="visible")
                    if otp_input:
                        found_selector = sel
                        break
                except Exception:
                    continue

            if not otp_input:
                # 有些验证码有 6 个独立输入框
                individual_inputs = await self.page.query_selector_all('input[maxlength="1"]')
                if len(individual_inputs) >= 6:
                    print("[*] 检测到 6 个独立验证码输入框")
                    for idx, digit in enumerate(otp_code[:6]):
                        await individual_inputs[idx].click()
                        await asyncio.sleep(random.uniform(0.1, 0.3))
                        await self.page.keyboard.type(digit, delay=random.randint(80, 200))
                        await asyncio.sleep(random.uniform(0.1, 0.25))
                    await self.human.random_wait(0.5, 1.0)
                else:
                    print("[Error] 未找到验证码输入框")
                    return False
            else:
                # 人类化输入验证码
                if found_selector:
                    await self.human.type_text_human(found_selector, otp_code)
                else:
                    await otp_input.click()
                    await self.human.random_wait(0.2, 0.5)
                    await self.page.keyboard.type(otp_code, delay=random.randint(80, 200))

            await self.human.random_wait(0.5, 1.5)

            # 点击验证按钮（如需手动提交）
            verify_selectors = [
                'button[type="submit"]',
                'button:has-text("Verify")',
                'button:has-text("验证")',
                'button:has-text("Continue")',
                'button:has-text("Submit")',
            ]
            for sel in verify_selectors:
                try:
                    btn = await self.page.wait_for_selector(sel, timeout=3000, state="visible")
                    if btn:
                        await self.human.click_element_human(sel)
                        break
                except Exception:
                    continue

            await self.human.thinking_pause()
            await self.page.wait_for_load_state("networkidle", timeout=20000)
            return True

        except Exception as e:
            print(f"[Error] 邮箱验证步骤失败: {e}")
            return False

    async def _step_fill_profile(self, name: str, birthday: str) -> bool:
        """步骤：填写个人信息（姓名、生日）"""
        try:
            await self.human.random_wait(1.0, 2.5)

            current_url = self.page.url
            page_content = await self.page.content()

            # 检查是否在个人信息页面
            needs_profile = (
                "about" in current_url.lower()
                or "profile" in current_url.lower()
                or "name" in page_content.lower()
                or "birthday" in page_content.lower()
                or "birth" in page_content.lower()
            )

            if not needs_profile:
                # 检查有没有名字输入框
                name_selectors = ['input[name="name"]', 'input[id="name"]', 'input[placeholder*="name" i]']
                for sel in name_selectors:
                    try:
                        el = await self.page.wait_for_selector(sel, timeout=2000, state="visible")
                        if el:
                            needs_profile = True
                            break
                    except Exception:
                        continue

            if not needs_profile:
                print("[*] 无需填写个人信息，跳过")
                return True

            print(f"[*] 填写个人信息: {name}")

            # 输入姓名
            name_selectors = [
                'input[name="name"]',
                'input[id="name"]',
                'input[placeholder*="name" i]',
                'input[placeholder*="Name" i]',
                'input[autocomplete="name"]',
            ]
            for sel in name_selectors:
                try:
                    el = await self.page.wait_for_selector(sel, timeout=3000, state="visible")
                    if el:
                        await self.human.type_with_mistakes(sel, name, mistake_rate=0.02)
                        break
                except Exception:
                    continue

            await self.human.random_wait(0.5, 1.0)

            # 输入生日
            bday_selectors = [
                'input[name="birthday"]',
                'input[name="birthdate"]',
                'input[name="dob"]',
                'input[type="date"]',
                'input[id="birthday"]',
                'input[placeholder*="birth" i]',
                'input[placeholder*="MM/DD/YYYY" i]',
                'input[placeholder*="YYYY-MM-DD" i]',
            ]

            for sel in bday_selectors:
                try:
                    el = await self.page.wait_for_selector(sel, timeout=3000, state="visible")
                    if el:
                        input_type = await el.get_attribute("type")
                        if input_type == "date":
                            await el.fill(birthday)
                        else:
                            await self.human.type_text_human(sel, birthday)
                        break
                except Exception:
                    continue

            await self.human.random_wait(0.5, 1.5)

            # 点击继续
            continue_selectors = [
                'button[type="submit"]',
                'button:has-text("Continue")',
                'button:has-text("继续")',
                'button:has-text("Agree")',
                'button:has-text("Submit")',
            ]
            for sel in continue_selectors:
                try:
                    btn = await self.page.wait_for_selector(sel, timeout=3000, state="visible")
                    if btn:
                        await self.human.click_element_human(sel)
                        break
                except Exception:
                    continue

            await self.human.thinking_pause()
            await self.page.wait_for_load_state("networkidle", timeout=15000)
            return True

        except Exception as e:
            print(f"[Error] 填写个人信息步骤失败: {e}")
            return False

    async def _capture_oauth_callback(self, oauth: dict, timeout: int = 30) -> Optional[str]:
        """捕获 OAuth callback URL 并交换 token"""
        try:
            start_time = time.time()

            while time.time() - start_time < timeout:
                current_url = self.page.url

                # 检查是否已经跳转到 callback URL
                if "code=" in current_url and "state=" in current_url:
                    print(f"[✓] 捕获到 OAuth callback!")
                    return submit_callback_url(
                        callback_url=current_url,
                        expected_state=oauth["state"],
                        code_verifier=oauth["code_verifier"],
                        redirect_uri=oauth["redirect_uri"],
                    )

                # 检查是否到了 localhost callback（浏览器会显示连接错误）
                if "localhost" in current_url and "code=" in current_url:
                    print(f"[✓] 捕获到 localhost callback!")
                    return submit_callback_url(
                        callback_url=current_url,
                        expected_state=oauth["state"],
                        code_verifier=oauth["code_verifier"],
                        redirect_uri=oauth["redirect_uri"],
                    )

                # 检查是否到了 ChatGPT 主页（注册成功可能直接跳转）
                if "chatgpt.com" in current_url and "/c/" in current_url:
                    print("[*] 已跳转到 ChatGPT 主页，尝试从 cookie 获取 token...")
                    # 不一定能从 cookie 直接拿到 token，但注册是成功的
                    break

                # 检查是否有需要处理的弹窗或按钮
                try:
                    # 处理可能的 consent/同意页面
                    consent_selectors = [
                        'button:has-text("Allow")',
                        'button:has-text("Accept")',
                        'button:has-text("Agree")',
                        'button:has-text("OK")',
                        'button:has-text("Continue")',
                    ]
                    for sel in consent_selectors:
                        try:
                            btn = await self.page.wait_for_selector(sel, timeout=1000, state="visible")
                            if btn:
                                await self.human.click_element_human(sel)
                                await self.human.random_wait(1.0, 2.0)
                                break
                        except Exception:
                            continue
                except Exception:
                    pass

                await asyncio.sleep(1)

            # 最后尝试一次 URL 检查
            final_url = self.page.url
            if "code=" in final_url and "state=" in final_url:
                return submit_callback_url(
                    callback_url=final_url,
                    expected_state=oauth["state"],
                    code_verifier=oauth["code_verifier"],
                    redirect_uri=oauth["redirect_uri"],
                )

            print("[Error] 等待 OAuth callback 超时")
            print(f"[Debug] 最终 URL: {final_url}")
            return None

        except Exception as e:
            print(f"[Error] 捕获 callback 失败: {e}")
            return None
