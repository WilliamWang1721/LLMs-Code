"""
邮箱池模块
从 /Users/williamwang/Downloads/register.py 提取的邮箱相关代码
支持: tempmail.lol / 1secmail / DuckMail / mail.gw
"""

import re
import time
import random
import secrets
from typing import Any, Dict, List, Optional

from curl_cffi import requests

from config import (
    MAIL_SOURCES, DUCKMAIL_KEY,
    MAILTM_BASE, TEMPMAIL_LOL_BASE, DUCKMAIL_BASE, ONESECMAIL_BASE,
)


# ==========================================
# Mail.tm / mail.gw 辅助
# ==========================================

def _mailtm_headers(*, token: str = "", use_json: bool = False) -> Dict[str, Any]:
    headers = {"Accept": "application/json"}
    if use_json:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _mailtm_domains(proxies: Any = None) -> List[str]:
    resp = requests.get(
        f"{MAILTM_BASE}/domains",
        headers=_mailtm_headers(),
        proxies=proxies,
        impersonate="chrome",
        timeout=15,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"获取 Mail.tm 域名失败，状态码: {resp.status_code}")

    data = resp.json()
    domains = []
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        items = data.get("hydra:member") or data.get("items") or []
    else:
        items = []

    for item in items:
        if not isinstance(item, dict):
            continue
        domain = str(item.get("domain") or "").strip()
        is_active = item.get("isActive", True)
        is_private = item.get("isPrivate", False)
        if domain and is_active and not is_private:
            domains.append(domain)

    return domains


# ==========================================
# 各邮箱源的创建实现
# ==========================================

def _try_duckmail(proxies: Any, duckmail_key: str) -> tuple:
    """尝试用 DuckMail 创建邮箱"""
    try:
        if duckmail_key:
            auth_headers = {"Authorization": f"Bearer {duckmail_key}", "Accept": "application/json"}
            dom_resp = requests.get(
                f"{DUCKMAIL_BASE}/domains",
                headers=auth_headers,
                proxies=proxies, impersonate="chrome", timeout=15,
            )
            domains = []
            if dom_resp.status_code == 200:
                for d in (dom_resp.json().get("hydra:member") or []):
                    if d.get("isVerified", False):
                        domains.append(d["domain"])
            if not domains:
                print("[*] DuckMail(key) 无已验证域名")
                return "", ""
            domain = random.choice(domains)
            local = f"u{secrets.token_hex(4)}"
            email = f"{local}@{domain}"
            mail_pwd = secrets.token_urlsafe(12)
            create_resp = requests.post(
                f"{DUCKMAIL_BASE}/accounts",
                headers={**auth_headers, "Content-Type": "application/json"},
                json={"address": email, "password": mail_pwd, "expiresIn": 86400},
                proxies=proxies, impersonate="chrome", timeout=15,
            )
            if create_resp.status_code not in (200, 201):
                print(f"[*] DuckMail(key) 创建失败: {create_resp.status_code}")
                return "", ""
            token_resp = requests.post(
                f"{DUCKMAIL_BASE}/token",
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                json={"address": email, "password": mail_pwd},
                proxies=proxies, impersonate="chrome", timeout=15,
            )
            if token_resp.status_code == 200:
                token = token_resp.json().get("token", "")
                if token:
                    print(f"[*] DuckMail(key) 邮箱: {email}")
                    return email, f"duckmail:{token}"
            print(f"[*] DuckMail(key) 获取 token 失败")
            return "", ""
        else:
            dom_resp = requests.get(
                f"{DUCKMAIL_BASE}/domains",
                headers={"Accept": "application/json"},
                proxies=proxies, impersonate="chrome", timeout=15,
            )
            domains = []
            if dom_resp.status_code == 200:
                data = dom_resp.json()
                if isinstance(data, list):
                    items = data
                elif isinstance(data, dict):
                    items = data.get("hydra:member") or []
                else:
                    items = []
                for d in items:
                    if isinstance(d, dict):
                        dom = str(d.get("domain") or "").strip()
                        if dom and d.get("isActive", True) and not d.get("isPrivate", False):
                            domains.append(dom)
            if not domains:
                print("[*] DuckMail(公共) 无可用域名")
                return "", ""
            domain = random.choice(domains)
            local = f"u{secrets.token_hex(4)}"
            email = f"{local}@{domain}"
            mail_pwd = secrets.token_urlsafe(12)
            create_resp = requests.post(
                f"{DUCKMAIL_BASE}/accounts",
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                json={"address": email, "password": mail_pwd},
                proxies=proxies, impersonate="chrome", timeout=15,
            )
            if create_resp.status_code not in (200, 201):
                print(f"[*] DuckMail(公共) 创建失败: {create_resp.status_code}")
                return "", ""
            token_resp = requests.post(
                f"{DUCKMAIL_BASE}/token",
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                json={"address": email, "password": mail_pwd},
                proxies=proxies, impersonate="chrome", timeout=15,
            )
            if token_resp.status_code == 200:
                token = token_resp.json().get("token", "")
                if token:
                    print(f"[*] DuckMail(公共) 邮箱: {email}")
                    return email, f"duckmail:{token}"
            print("[*] DuckMail(公共) 获取 token 失败")
            return "", ""
    except Exception as e:
        print(f"[*] DuckMail 不可用: {e}")
        return "", ""


def _try_tempmail_lol(proxies: Any) -> tuple:
    """尝试用 tempmail.lol 创建邮箱"""
    try:
        resp = requests.post(
            f"{TEMPMAIL_LOL_BASE}/inbox/create",
            headers={"Content-Type": "application/json"},
            proxies=proxies, impersonate="chrome", timeout=15,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            email = data.get("address", "")
            token = data.get("token", "")
            if email and token:
                print(f"[*] tempmail.lol 邮箱: {email}")
                return email, f"tempmail_lol:{token}"
        print(f"[*] tempmail.lol 返回 {resp.status_code}")
    except Exception as e:
        print(f"[*] tempmail.lol 不可用: {e}")
    return "", ""


def _try_onesecmail(proxies: Any) -> tuple:
    """尝试用 1secmail 创建邮箱"""
    try:
        dom_resp = requests.get(
            f"{ONESECMAIL_BASE}?action=getDomainList",
            proxies=proxies, impersonate="chrome", timeout=15,
        )
        if dom_resp.status_code != 200:
            print(f"[*] 1secmail 获取域名失败: {dom_resp.status_code}")
            return "", ""
        domains = dom_resp.json()
        if not domains:
            print("[*] 1secmail 无可用域名")
            return "", ""
        domain = random.choice(domains)
        login = f"u{secrets.token_hex(5)}"
        email = f"{login}@{domain}"
        print(f"[*] 1secmail 邮箱: {email}")
        return email, f"onesecmail:{login}:{domain}"
    except Exception as e:
        print(f"[*] 1secmail 不可用: {e}")
        return "", ""


def _try_mailtm(proxies: Any) -> tuple:
    """回退：mail.gw"""
    try:
        domains = _mailtm_domains(proxies)
        if not domains:
            print("[Error] Mail.tm 没有可用域名")
            return "", ""
        domain = random.choice(domains)
        for _ in range(5):
            local = f"oc{secrets.token_hex(5)}"
            email = f"{local}@{domain}"
            password = secrets.token_urlsafe(18)
            create_resp = requests.post(
                f"{MAILTM_BASE}/accounts",
                headers=_mailtm_headers(use_json=True),
                json={"address": email, "password": password},
                proxies=proxies, impersonate="chrome", timeout=15,
            )
            if create_resp.status_code not in (200, 201):
                continue
            token_resp = requests.post(
                f"{MAILTM_BASE}/token",
                headers=_mailtm_headers(use_json=True),
                json={"address": email, "password": password},
                proxies=proxies, impersonate="chrome", timeout=15,
            )
            if token_resp.status_code == 200:
                token = str(token_resp.json().get("token") or "").strip()
                if token:
                    return email, token
        print("[Error] Mail.tm 邮箱创建失败")
        return "", ""
    except Exception as e:
        print(f"[Error] 请求 Mail.tm API 出错: {e}")
        return "", ""


# ==========================================
# 统一入口：获取邮箱
# ==========================================

def get_email_and_token(proxies: Any = None) -> tuple:
    """从已启用的邮箱源中随机选一个，失败后依次尝试其余，最后兜底 mail.gw"""
    enabled = []
    if MAIL_SOURCES.get("tempmail_lol"):
        enabled.append("tempmail_lol")
    if MAIL_SOURCES.get("onesecmail"):
        enabled.append("onesecmail")
    if MAIL_SOURCES.get("duckmail"):
        enabled.append("duckmail")
    if MAIL_SOURCES.get("mailtm"):
        enabled.append("mailtm")

    if not enabled:
        enabled = ["tempmail_lol"]

    random.shuffle(enabled)
    print(f"[*] 邮箱源: {' -> '.join(enabled)}")

    for source in enabled:
        if source == "duckmail":
            email, token = _try_duckmail(proxies, DUCKMAIL_KEY)
        elif source == "tempmail_lol":
            email, token = _try_tempmail_lol(proxies)
        elif source == "onesecmail":
            email, token = _try_onesecmail(proxies)
        elif source == "mailtm":
            email, token = _try_mailtm(proxies)
        else:
            continue
        if email and token:
            return email, token

    if not MAIL_SOURCES.get("mailtm"):
        print("[*] 启用源均失败，兜底 mail.gw")
        return _try_mailtm(proxies)

    return "", ""


# ==========================================
# 轮询获取验证码
# ==========================================

def _poll_hydra_otp(base_url: str, token: str, regex: str, proxies: Any = None, seen_msg_ids: set = None) -> str:
    """通用 hydra 格式邮箱轮询 OTP"""
    if seen_msg_ids is None:
        seen_msg_ids = set()
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

    for _ in range(40):
        print(".", end="", flush=True)
        try:
            resp = requests.get(
                f"{base_url}/messages",
                headers=headers,
                proxies=proxies,
                impersonate="chrome",
                timeout=15,
            )
            if resp.status_code != 200:
                time.sleep(3)
                continue

            data = resp.json()
            messages = []
            if isinstance(data, list):
                messages = data
            elif isinstance(data, dict):
                messages = data.get("hydra:member") or data.get("messages") or []

            for msg in messages:
                if not isinstance(msg, dict):
                    continue
                msg_id = str(msg.get("id") or "").strip()
                if not msg_id or msg_id in seen_msg_ids:
                    continue
                seen_msg_ids.add(msg_id)

                read_resp = requests.get(
                    f"{base_url}/messages/{msg_id}",
                    headers=headers,
                    proxies=proxies,
                    impersonate="chrome",
                    timeout=15,
                )
                if read_resp.status_code != 200:
                    continue

                mail_data = read_resp.json()
                sender = str(
                    ((mail_data.get("from") or {}).get("address") or "")
                ).lower()
                subject = str(mail_data.get("subject") or "")
                intro = str(mail_data.get("intro") or "")
                text = str(mail_data.get("text") or "")
                html = mail_data.get("html") or ""
                if isinstance(html, list):
                    html = "\n".join(str(x) for x in html)
                content = "\n".join([subject, intro, text, str(html)])

                if "openai" not in sender and "openai" not in content.lower():
                    continue

                m = re.search(regex, content)
                if m:
                    print(f" 抓到啦! 验证码: {m.group(1)}")
                    return m.group(1)
        except Exception:
            pass

        time.sleep(3)

    print(" 超时，未收到验证码")
    return ""


def get_oai_code(token: str, email: str, proxies: Any = None, seen_msg_ids: set = None) -> str:
    """轮询获取 OpenAI 验证码（支持 onesecmail / duckmail / tempmail.lol / mail.gw）"""
    if seen_msg_ids is None:
        seen_msg_ids = set()
    regex = r"(?<!\d)(\d{6})(?!\d)"
    print(f"[*] 正在等待邮箱 {email} 的验证码...", end="", flush=True)

    if token.startswith("onesecmail:"):
        parts = token[len("onesecmail:"):].split(":", 1)
        login, domain = parts[0], parts[1]
        for _ in range(40):
            print(".", end="", flush=True)
            try:
                resp = requests.get(
                    f"{ONESECMAIL_BASE}?action=getMessages&login={login}&domain={domain}",
                    proxies=proxies, impersonate="chrome", timeout=15,
                )
                if resp.status_code != 200:
                    time.sleep(3)
                    continue
                for msg in resp.json():
                    msg_id = str(msg.get("id", ""))
                    if msg_id in seen_msg_ids:
                        continue
                    seen_msg_ids.add(msg_id)
                    rd = requests.get(
                        f"{ONESECMAIL_BASE}?action=readMessage&login={login}&domain={domain}&id={msg_id}",
                        proxies=proxies, impersonate="chrome", timeout=15,
                    )
                    if rd.status_code != 200:
                        continue
                    md = rd.json()
                    sender = str(md.get("from", "")).lower()
                    subject = str(md.get("subject", ""))
                    body = str(md.get("textBody", ""))
                    html = str(md.get("htmlBody", ""))
                    content = "\n".join([sender, subject, body, html])
                    if "openai" not in content.lower():
                        continue
                    m = re.search(regex, content)
                    if m:
                        print(f" 抓到啦! 验证码: {m.group(1)}")
                        return m.group(1)
            except Exception:
                pass
            time.sleep(3)
        print(" 超时，未收到验证码")
        return ""

    if token.startswith("duckmail:"):
        return _poll_hydra_otp(DUCKMAIL_BASE, token[len("duckmail:"):], regex, proxies, seen_msg_ids)

    if token.startswith("tempmail_lol:"):
        real_token = token[len("tempmail_lol:"):]
        for _ in range(40):
            print(".", end="", flush=True)
            try:
                resp = requests.get(
                    f"{TEMPMAIL_LOL_BASE}/inbox?token={real_token}",
                    proxies=proxies,
                    impersonate="chrome",
                    timeout=15,
                )
                if resp.status_code != 200:
                    time.sleep(3)
                    continue
                data = resp.json()
                for msg in data.get("emails", []):
                    msg_id = str(msg.get("id") or msg.get("messageId") or "")
                    if msg_id in seen_msg_ids:
                        continue
                    seen_msg_ids.add(msg_id)
                    sender = str(msg.get("from") or "").lower()
                    subject = str(msg.get("subject") or "")
                    body = str(msg.get("body") or msg.get("text") or "")
                    html = str(msg.get("html") or "")
                    content = "\n".join([sender, subject, body, html])
                    if "openai" not in content.lower():
                        continue
                    m = re.search(regex, content)
                    if m:
                        print(f" 抓到啦! 验证码: {m.group(1)}")
                        return m.group(1)
            except Exception:
                pass
            time.sleep(3)
        print(" 超时，未收到验证码")
        return ""

    # mail.gw / mail.tm 模式
    return _poll_hydra_otp(MAILTM_BASE, token, regex, proxies, seen_msg_ids)
