"""
ChatGPT Free 全自动注册系统 — 主入口
交互式终端界面 + Playwright 指纹浏览器自动化
"""

import os
import sys
import json
import time
import random
import asyncio
import signal
import threading
import base64
import hashlib
import secrets
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

import config
from email_pool import get_email_and_token, get_oai_code
from register_flow import ChatGPTRegistrar, _jwt_claims_no_verify


# ==========================================
# 终端颜色 & 样式
# ==========================================

class Color:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"

    BG_BLACK = "\033[40m"
    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    BG_BLUE = "\033[44m"
    BG_CYAN = "\033[46m"


def _c(text: str, color: str) -> str:
    return f"{color}{text}{Color.RESET}"


def _banner():
    """显示启动 Banner"""
    banner = f"""
{_c('╔══════════════════════════════════════════════════════════╗', Color.CYAN)}
{_c('║', Color.CYAN)}  {_c('🤖 ChatGPT Free 全自动注册系统', Color.BOLD + Color.GREEN)}                     {_c('║', Color.CYAN)}
{_c('║', Color.CYAN)}  {_c('Playwright 指纹浏览器 + 人类行为模拟', Color.DIM)}                {_c('║', Color.CYAN)}
{_c('╚══════════════════════════════════════════════════════════╝', Color.CYAN)}
"""
    print(banner)


def _divider():
    print(f"{_c('─' * 58, Color.DIM)}")


# ==========================================
# Clash 节点切换（从 register.py 移植）
# ==========================================

def clash_switch_node() -> str:
    """通过 Clash RESTful API 随机切换代理节点"""
    if not config.CLASH_ENABLED:
        return ""
    try:
        headers = {"Authorization": f"Bearer {config.CLASH_SECRET}"}

        def _clash_get(path: str) -> dict:
            req = urllib.request.Request(
                f"{config.CLASH_API_URL}{path}", headers=headers,
            )
            with urllib.request.urlopen(req, timeout=5) as r:
                return json.loads(r.read().decode("utf-8"))

        def _clash_put(path: str, body: dict) -> int:
            data = json.dumps(body).encode("utf-8")
            req = urllib.request.Request(
                f"{config.CLASH_API_URL}{path}", data=data, method="PUT",
                headers={**headers, "Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=5) as r:
                return r.status

        proxies_data = _clash_get("/proxies").get("proxies", {})
        group_name = config.CLASH_PROXY_GROUP
        if not group_name:
            for name, info in proxies_data.items():
                ptype = info.get("type", "")
                if ptype in ("Selector", "URLTest", "Fallback"):
                    group_name = name
                    break

        if not group_name or group_name not in proxies_data:
            print(f"  {_c('[Clash]', Color.YELLOW)} 未找到可用代理组")
            return ""

        group = proxies_data[group_name]
        all_nodes = group.get("all", [])
        current = group.get("now", "")

        skip = {"DIRECT", "REJECT", "GLOBAL", "PASS", current, "自动选择", "故障转移"}
        candidates = []
        for n in all_nodes:
            if n in skip or n.startswith("_") or n.startswith("❤"):
                continue
            n_upper = n.upper()
            if any(kw.upper() in n_upper for kw in config.CLASH_BLOCK_KEYWORDS):
                continue
            cur_prefix = current.split(" ")[0:2]
            n_prefix = n.split(" ")[0:2]
            if cur_prefix == n_prefix and n != current:
                continue
            candidates.append(n)

        if not candidates:
            print(f"  {_c('[Clash]', Color.YELLOW)} 无可切换节点")
            return ""

        target = random.choice(candidates)
        status = _clash_put(f"/proxies/{urllib.parse.quote(group_name)}", {"name": target})
        if status in (200, 204):
            print(f"  {_c('[Clash]', Color.GREEN)} 切换节点: {target}")
            time.sleep(1)
            return target
        else:
            print(f"  {_c('[Clash]', Color.RED)} 切换失败: {status}")
            return ""
    except Exception as e:
        print(f"  {_c('[Clash]', Color.RED)} 切换异常: {e}")
        return ""


# ==========================================
# Sub2Api 推送（从 register.py 移植）
# ==========================================

_sub2api_token = ""
_sub2api_lock = threading.Lock()


def _sub2api_login() -> str:
    try:
        from curl_cffi import requests as cffi_requests
        resp = cffi_requests.post(
            f"{config.SUB2API_URL}/api/v1/auth/login",
            json={"email": config.SUB2API_EMAIL, "password": config.SUB2API_PASSWORD},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json().get("data", {}).get("access_token", "")
    except Exception as e:
        print(f"  {_c('[Sub2Api]', Color.RED)} 登录失败: {e}")
    return ""


def push_to_sub2api(token_json_str: str) -> bool:
    global _sub2api_token
    try:
        from curl_cffi import requests as cffi_requests
        t = json.loads(token_json_str)
        email = t.get("email", "")
        access_token = t.get("access_token", "")
        refresh_token = t.get("refresh_token", "")
        account_id = t.get("account_id", "")

        if not refresh_token:
            print(f"  {_c('[Sub2Api]', Color.YELLOW)} 缺少 refresh_token，跳过推送")
            return False

        at_claims = _jwt_claims_no_verify(access_token)
        at_auth = at_claims.get("https://api.openai.com/auth") or {}
        exp = at_claims.get("exp", int(time.time()) + 863999)

        id_token = t.get("id_token", "")
        it_claims = _jwt_claims_no_verify(id_token)
        it_auth = it_claims.get("https://api.openai.com/auth") or {}
        org_id = ""
        orgs = it_auth.get("organizations") or []
        if orgs:
            org_id = (orgs[0] or {}).get("id", "")

        payload = {
            "name": email,
            "notes": "",
            "platform": "openai",
            "type": "oauth",
            "credentials": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_in": 863999,
                "expires_at": exp,
                "chatgpt_account_id": account_id or at_auth.get("chatgpt_account_id", ""),
                "chatgpt_user_id": at_auth.get("chatgpt_user_id", ""),
                "organization_id": org_id,
            },
            "extra": {"email": email},
            "group_ids": [2],
            "concurrency": 10,
            "priority": 1,
            "auto_pause_on_expired": True,
        }

        with _sub2api_lock:
            if not _sub2api_token:
                _sub2api_token = _sub2api_login()
            if not _sub2api_token:
                print(f"  {_c('[Sub2Api]', Color.RED)} 无法获取 token，推送失败")
                return False
            current_token = _sub2api_token

        resp = cffi_requests.post(
            f"{config.SUB2API_URL}/api/v1/admin/accounts",
            json=payload,
            headers={
                "Authorization": f"Bearer {current_token}",
                "Content-Type": "application/json",
            },
            timeout=20,
        )

        if resp.status_code == 401:
            with _sub2api_lock:
                if _sub2api_token == current_token:
                    _sub2api_token = _sub2api_login()
                current_token = _sub2api_token
            if current_token:
                resp = cffi_requests.post(
                    f"{config.SUB2API_URL}/api/v1/admin/accounts",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {current_token}",
                        "Content-Type": "application/json",
                    },
                    timeout=20,
                )

        if resp.status_code in (200, 201):
            print(f"  {_c('[Sub2Api]', Color.GREEN)} 推送成功!")
            return True
        else:
            print(f"  {_c('[Sub2Api]', Color.RED)} 推送失败 ({resp.status_code})")
            return False
    except Exception as e:
        print(f"  {_c('[Sub2Api]', Color.RED)} 推送异常: {e}")
        return False


# ==========================================
# Token 保存
# ==========================================

def save_token(token_json: str) -> str:
    """保存 token 到文件，返回文件路径"""
    try:
        t_data = json.loads(token_json)
        fname_email = t_data.get("email", "unknown").replace("@", "_")
    except Exception:
        fname_email = "unknown"

    file_name = f"token_{fname_email}_{int(time.time())}.json"
    tokens_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tokens")
    os.makedirs(tokens_dir, exist_ok=True)
    file_path = os.path.join(tokens_dir, file_name)

    with open(file_path, "w", encoding="utf-8") as f:
        # 美化输出 JSON
        try:
            formatted = json.dumps(json.loads(token_json), ensure_ascii=False, indent=2)
            f.write(formatted)
        except Exception:
            f.write(token_json)

    return file_path


# ==========================================
# 交互式终端界面
# ==========================================

def interactive_menu() -> dict:
    """交互式终端配置菜单"""
    _banner()

    settings = {
        "proxy": config.PROXY_URL,
        "count": config.MAX_REGISTER_COUNT,
        "headless": config.HEADLESS,
        "sub2api": config.SUB2API_ENABLED,
        "clash": config.CLASH_ENABLED,
        "sleep_min": config.SLEEP_MIN,
        "sleep_max": config.SLEEP_MAX,
    }

    def _show_settings():
        """显示当前配置"""
        _divider()
        print(f"  {_c('当前配置:', Color.BOLD + Color.WHITE)}")
        _divider()
        proxy_display = settings['proxy'] if settings['proxy'] else _c('无代理 (直连)', Color.YELLOW)
        print(f"  {_c('1.', Color.CYAN)} 代理地址      │ {proxy_display}")
        print(f"  {_c('2.', Color.CYAN)} 注册数量      │ {_c(str(settings['count']), Color.GREEN)}")
        mode = _c('无头模式 (后台运行)', Color.BLUE) if settings['headless'] else _c('有头模式 (显示界面)', Color.GREEN)
        print(f"  {_c('3.', Color.CYAN)} 浏览器模式    │ {mode}")
        s2a = _c('✓ 开启', Color.GREEN) if settings['sub2api'] else _c('✗ 关闭', Color.RED)
        print(f"  {_c('4.', Color.CYAN)} Sub2Api 推送  │ {s2a}")
        clash = _c('✓ 开启', Color.GREEN) if settings['clash'] else _c('✗ 关闭', Color.RED)
        print(f"  {_c('5.', Color.CYAN)} Clash 节点切换│ {clash}")
        smin = settings['sleep_min']
        smax = settings['sleep_max']
        print(f"  {_c('6.', Color.CYAN)} 注册间隔      │ {_c(str(smin) + '~' + str(smax), Color.WHITE)} 秒")
        _divider()
        print(f"  {_c('0.', Color.GREEN + Color.BOLD)} {_c('开始注册', Color.GREEN + Color.BOLD)}")
        print(f"  {_c('q.', Color.RED)} {_c('退出程序', Color.RED)}")
        _divider()

    while True:
        _show_settings()
        choice = input(f"\n  {_c('请输入选项编号:', Color.YELLOW)} ").strip()

        if choice == "0":
            break
        elif choice == "q" or choice == "Q":
            print(f"\n  {_c('再见! 👋', Color.CYAN)}")
            sys.exit(0)
        elif choice == "1":
            proxy = input(f"  {_c('请输入代理地址', Color.YELLOW)} (留空取消代理, 当前: {settings['proxy'] or '无'}): ").strip()
            if proxy == "":
                confirm = input(f"  {_c('确认取消代理? (y/n):', Color.YELLOW)} ").strip().lower()
                if confirm == "y":
                    settings["proxy"] = ""
                    print(f"  {_c('✓ 已取消代理', Color.GREEN)}")
            else:
                settings["proxy"] = proxy
                print(f"  {_c('✓ 代理已设置为:', Color.GREEN)} {proxy}")
        elif choice == "2":
            count_str = input(f"  {_c('请输入注册数量', Color.YELLOW)} (当前: {settings['count']}): ").strip()
            try:
                count = int(count_str)
                if count < 1:
                    print(f"  {_c('✗ 数量必须大于 0', Color.RED)}")
                else:
                    settings["count"] = count
                    print(f"  {_c('✓ 注册数量已设置为:', Color.GREEN)} {count}")
            except ValueError:
                print(f"  {_c('✗ 请输入有效数字', Color.RED)}")
        elif choice == "3":
            current = "无头" if settings["headless"] else "有头"
            toggle = input(f"  {_c(f'当前: {current}模式. 切换? (y/n):', Color.YELLOW)} ").strip().lower()
            if toggle == "y":
                settings["headless"] = not settings["headless"]
                new_mode = "无头模式" if settings["headless"] else "有头模式"
                print(f"  {_c('✓ 已切换为:', Color.GREEN)} {new_mode}")
        elif choice == "4":
            current = "开启" if settings["sub2api"] else "关闭"
            toggle = input(f"  {_c(f'Sub2Api 当前: {current}. 切换? (y/n):', Color.YELLOW)} ").strip().lower()
            if toggle == "y":
                settings["sub2api"] = not settings["sub2api"]
                new_state = "开启" if settings["sub2api"] else "关闭"
                print(f"  {_c('✓ Sub2Api 已', Color.GREEN)}{new_state}")
        elif choice == "5":
            current = "开启" if settings["clash"] else "关闭"
            toggle = input(f"  {_c(f'Clash 当前: {current}. 切换? (y/n):', Color.YELLOW)} ").strip().lower()
            if toggle == "y":
                settings["clash"] = not settings["clash"]
                new_state = "开启" if settings["clash"] else "关闭"
                print(f"  {_c('✓ Clash 节点切换已', Color.GREEN)}{new_state}")
                if settings["clash"]:
                    # 额外配置 Clash
                    api = input(f"  {_c('Clash API 地址', Color.YELLOW)} (当前: {config.CLASH_API_URL}): ").strip()
                    if api:
                        config.CLASH_API_URL = api
                    secret = input(f"  {_c('Clash Secret', Color.YELLOW)} (当前: {config.CLASH_SECRET}): ").strip()
                    if secret:
                        config.CLASH_SECRET = secret
                    group = input(f"  {_c('代理组名称', Color.YELLOW)} (当前: {config.CLASH_PROXY_GROUP}): ").strip()
                    if group:
                        config.CLASH_PROXY_GROUP = group
        elif choice == "6":
            try:
                min_s = input(f"  {_c('最短间隔 (秒)', Color.YELLOW)} (当前: {settings['sleep_min']}): ").strip()
                max_s = input(f"  {_c('最长间隔 (秒)', Color.YELLOW)} (当前: {settings['sleep_max']}): ").strip()
                if min_s:
                    settings["sleep_min"] = max(1, int(min_s))
                if max_s:
                    settings["sleep_max"] = max(settings["sleep_min"], int(max_s))
                print(f"  {_c('✓ 间隔已设置为:', Color.GREEN)} {settings['sleep_min']}~{settings['sleep_max']} 秒")
            except ValueError:
                print(f"  {_c('✗ 请输入有效数字', Color.RED)}")
        else:
            print(f"  {_c('✗ 无效选项，请重新输入', Color.RED)}")

        print()  # 空行分隔

    return settings


# ==========================================
# 注册执行器
# ==========================================

async def run_single_registration(
    index: int,
    total: int,
    proxy: str,
    headless: bool,
    sub2api_enabled: bool,
) -> bool:
    """执行单次注册"""
    print()
    print(f"  {_c('═' * 50, Color.CYAN)}")
    print(f"  {_c(f'  📋 第 {index}/{total} 次注册', Color.BOLD + Color.WHITE)}  {_c(datetime.now().strftime('%H:%M:%S'), Color.DIM)}")
    print(f"  {_c('═' * 50, Color.CYAN)}")
    print()

    registrar = ChatGPTRegistrar(
        proxy_url=proxy if proxy else None,
        headless=headless,
    )

    token_json = await registrar.register_one()

    if token_json:
        # 保存 token
        file_path = save_token(token_json)
        print()
        print(f"  {_c('🎉 注册成功!', Color.BOLD + Color.GREEN)}")
        print(f"  {_c('📁 Token 已保存至:', Color.WHITE)} {file_path}")

        # 推送到 Sub2Api
        if sub2api_enabled:
            push_to_sub2api(token_json)

        # 显示摘要
        try:
            t_data = json.loads(token_json)
            print(f"  {_c('📧 Email:', Color.WHITE)} {t_data.get('email', 'N/A')}")
            print(f"  {_c('🆔 Account:', Color.WHITE)} {t_data.get('account_id', 'N/A')[:20]}...")
        except Exception:
            pass

        return True
    else:
        print()
        print(f"  {_c('❌ 注册失败', Color.RED)}")
        return False


async def run_registration_loop(settings: dict):
    """注册循环主流程"""
    proxy = settings["proxy"]
    count = settings["count"]
    headless = settings["headless"]
    sub2api_enabled = settings["sub2api"]
    clash_enabled = settings["clash"]
    sleep_min = settings["sleep_min"]
    sleep_max = settings["sleep_max"]

    # 更新全局配置
    config.PROXY_URL = proxy
    config.HEADLESS = headless
    config.SUB2API_ENABLED = sub2api_enabled
    config.CLASH_ENABLED = clash_enabled

    success_count = 0
    fail_count = 0

    print()
    print(f"  {_c('🚀 开始注册流程', Color.BOLD + Color.GREEN)}")
    print(f"  {_c('目标:', Color.WHITE)} {count} 个账户")
    print(f"  {_c('代理:', Color.WHITE)} {proxy if proxy else '无'}")
    print(f"  {_c('模式:', Color.WHITE)} {'无头' if headless else '有头'}")
    print()

    for i in range(1, count + 1):
        # Clash 节点切换
        if clash_enabled:
            clash_switch_node()

        # 执行注册
        success = await run_single_registration(
            index=i,
            total=count,
            proxy=proxy,
            headless=headless,
            sub2api_enabled=sub2api_enabled,
        )

        if success:
            success_count += 1
        else:
            fail_count += 1

        # 显示进度
        print()
        _divider()
        print(f"  {_c('📊 当前进度:', Color.BOLD + Color.WHITE)} "
              f"{_c(f'✓ {success_count}', Color.GREEN)} / "
              f"{_c(f'✗ {fail_count}', Color.RED)} / "
              f"{_c(f'共 {count}', Color.WHITE)}")
        _divider()

        # 休息
        if i < count:
            wait_time = random.randint(sleep_min, sleep_max)
            print(f"  {_c(f'⏳ 休息 {wait_time} 秒...', Color.DIM)}")
            await asyncio.sleep(wait_time)

    # 最终汇总
    print()
    print(f"  {_c('╔══════════════════════════════════════╗', Color.CYAN)}")
    print(f"  {_c('║', Color.CYAN)}  {_c('📊 注册完成 — 最终统计', Color.BOLD + Color.WHITE)}        {_c('║', Color.CYAN)}")
    print(f"  {_c('╠══════════════════════════════════════╣', Color.CYAN)}")
    print(f"  {_c('║', Color.CYAN)}  {_c(f'✓ 成功: {success_count}', Color.GREEN):<36}  {_c('║', Color.CYAN)}")
    print(f"  {_c('║', Color.CYAN)}  {_c(f'✗ 失败: {fail_count}', Color.RED):<36}  {_c('║', Color.CYAN)}")
    print(f"  {_c('║', Color.CYAN)}  {_c(f'总计:   {count}', Color.WHITE):<36}  {_c('║', Color.CYAN)}")
    rate = (success_count / count * 100) if count > 0 else 0
    print(f"  {_c('║', Color.CYAN)}  {_c(f'成功率: {rate:.1f}%', Color.YELLOW):<36}  {_c('║', Color.CYAN)}")
    print(f"  {_c('╚══════════════════════════════════════╝', Color.CYAN)}")
    print()


# ==========================================
# 入口
# ==========================================

def main():
    # 支持命令行参数快速启动（不进入交互模式）
    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        settings = {
            "proxy": config.PROXY_URL,
            "count": config.MAX_REGISTER_COUNT,
            "headless": config.HEADLESS,
            "sub2api": config.SUB2API_ENABLED,
            "clash": config.CLASH_ENABLED,
            "sleep_min": config.SLEEP_MIN,
            "sleep_max": config.SLEEP_MAX,
        }
        # 快速参数覆盖
        for arg in sys.argv[2:]:
            if arg.startswith("--proxy="):
                settings["proxy"] = arg.split("=", 1)[1]
            elif arg.startswith("--count="):
                settings["count"] = int(arg.split("=", 1)[1])
            elif arg == "--headless":
                settings["headless"] = True
            elif arg == "--headed":
                settings["headless"] = False
    else:
        # 交互式菜单
        settings = interactive_menu()

    # 确认配置
    print()
    print(f"  {_c('⚙ 最终配置确认:', Color.BOLD + Color.YELLOW)}")
    print(f"    代理: {settings['proxy'] or '无'}")
    print(f"    数量: {settings['count']}")
    print(f"    模式: {'无头' if settings['headless'] else '有头'}")
    print(f"    Sub2Api: {'开' if settings['sub2api'] else '关'}")
    print(f"    Clash: {'开' if settings['clash'] else '关'}")
    print(f"    间隔: {settings['sleep_min']}~{settings['sleep_max']}s")
    print()

    confirm = input(f"  {_c('确认开始? (Y/n):', Color.GREEN + Color.BOLD)} ").strip().lower()
    if confirm == "n":
        print(f"  {_c('已取消', Color.YELLOW)}")
        return

    # 运行注册循环
    try:
        asyncio.run(run_registration_loop(settings))
    except KeyboardInterrupt:
        print(f"\n\n  {_c('⚠ 用户中断，正在退出...', Color.YELLOW)}")
    except Exception as e:
        print(f"\n  {_c(f'❌ 程序异常: {e}', Color.RED)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
