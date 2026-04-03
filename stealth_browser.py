"""
指纹浏览器模块
使用 Playwright + Stealth 插件 + 自定义指纹注入
最大程度减少浏览器自动化检测痕迹
"""

import random
import json
from typing import Optional, Dict, Any

from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from playwright_stealth import Stealth

from config import HEADLESS, BROWSER_TIMEOUT, SLOW_MO, PROXY_URL


# ==========================================
# 指纹数据库
# ==========================================

# 常见屏幕分辨率
SCREEN_RESOLUTIONS = [
    {"width": 1920, "height": 1080},
    {"width": 1366, "height": 768},
    {"width": 1536, "height": 864},
    {"width": 1440, "height": 900},
    {"width": 1280, "height": 720},
    {"width": 1600, "height": 900},
    {"width": 2560, "height": 1440},
    {"width": 1280, "height": 800},
    {"width": 1680, "height": 1050},
]

# Chrome User-Agent 版本库
CHROME_VERSIONS = [
    {
        "major": 131,
        "build": 6778,
        "patch_range": (69, 205),
        "sec_ch_ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    },
    {
        "major": 133,
        "build": 6943,
        "patch_range": (33, 153),
        "sec_ch_ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    },
    {
        "major": 134,
        "build": 6998,
        "patch_range": (20, 120),
        "sec_ch_ua": '"Google Chrome";v="134", "Chromium";v="134", "Not:A-Brand";v="24"',
    },
    {
        "major": 135,
        "build": 7049,
        "patch_range": (30, 140),
        "sec_ch_ua": '"Google Chrome";v="135", "Chromium";v="135", "Not-A.Brand";v="8"',
    },
    {
        "major": 136,
        "build": 7103,
        "patch_range": (48, 175),
        "sec_ch_ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    },
]

# 操作系统平台
PLATFORMS = [
    {"platform": "Win32", "os_part": "Windows NT 10.0; Win64; x64"},
    {"platform": "Win32", "os_part": "Windows NT 10.0; Win64; x64"},  # 权重大
    {"platform": "MacIntel", "os_part": "Macintosh; Intel Mac OS X 10_15_7"},
    {"platform": "Linux x86_64", "os_part": "X11; Linux x86_64"},
]

# 时区池（排除中国区域）
TIMEZONES = [
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Phoenix", "America/Anchorage", "Pacific/Honolulu",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Rome",
    "Europe/Madrid", "Europe/Amsterdam", "Europe/Stockholm",
    "Asia/Tokyo", "Asia/Seoul", "Asia/Singapore",
    "Australia/Sydney", "Australia/Melbourne",
    "America/Toronto", "America/Vancouver",
]

# 语言池
LANGUAGES = [
    ["en-US", "en"],
    ["en-GB", "en"],
    ["en-US", "en", "fr"],
    ["en-US", "en", "de"],
    ["en-US", "en", "ja"],
    ["en-US", "en", "es"],
]

# WebGL Renderer/Vendor 组合
WEBGL_CONFIGS = [
    {"vendor": "Google Inc. (NVIDIA)", "renderer": "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)"},
    {"vendor": "Google Inc. (NVIDIA)", "renderer": "ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)"},
    {"vendor": "Google Inc. (NVIDIA)", "renderer": "ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)"},
    {"vendor": "Google Inc. (AMD)", "renderer": "ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)"},
    {"vendor": "Google Inc. (Intel)", "renderer": "ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)"},
    {"vendor": "Google Inc. (Intel)", "renderer": "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)"},
    {"vendor": "Google Inc. (Apple)", "renderer": "ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)"},
    {"vendor": "Google Inc. (Apple)", "renderer": "ANGLE (Apple, Apple M2, OpenGL 4.1)"},
]


def _generate_fingerprint() -> Dict[str, Any]:
    """生成一套随机的浏览器指纹"""
    chrome = random.choice(CHROME_VERSIONS)
    patch = random.randint(*chrome["patch_range"])
    platform_info = random.choice(PLATFORMS)
    screen = random.choice(SCREEN_RESOLUTIONS)
    webgl = random.choice(WEBGL_CONFIGS)
    timezone = random.choice(TIMEZONES)
    languages = random.choice(LANGUAGES)

    major = chrome["major"]
    build = chrome["build"]
    full_version = f"{major}.0.{build}.{patch}"

    user_agent = (
        f"Mozilla/5.0 ({platform_info['os_part']}) "
        f"AppleWebKit/537.36 (KHTML, like Gecko) "
        f"Chrome/{full_version} Safari/537.36"
    )

    return {
        "user_agent": user_agent,
        "sec_ch_ua": chrome["sec_ch_ua"],
        "platform": platform_info["platform"],
        "screen": screen,
        "webgl": webgl,
        "timezone": timezone,
        "languages": languages,
        "hardware_concurrency": random.choice([4, 8, 12, 16]),
        "device_memory": random.choice([4, 8, 16, 32]),
        "max_touch_points": 0,
        "color_depth": 24,
        "pixel_ratio": random.choice([1, 1.25, 1.5, 2]),
    }


# ==========================================
# 自定义反检测 JS 注入
# ==========================================

def _build_stealth_js(fingerprint: Dict[str, Any]) -> str:
    """构建自定义的反检测 JavaScript 注入脚本"""
    webgl = fingerprint["webgl"]
    hw_concurrency = fingerprint["hardware_concurrency"]
    dev_memory = fingerprint["device_memory"]
    platform = fingerprint["platform"]
    languages = fingerprint["languages"]
    screen = fingerprint["screen"]
    color_depth = fingerprint["color_depth"]
    pixel_ratio = fingerprint["pixel_ratio"]

    return f"""
    // ====== 自定义指纹注入 ======

    // 1. 覆盖 navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {{
        get: () => undefined,
        configurable: true,
    }});

    // 2. 覆盖 navigator.plugins（模拟真实插件列表）
    Object.defineProperty(navigator, 'plugins', {{
        get: () => {{
            const plugins = [
                {{ name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }},
                {{ name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' }},
                {{ name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }},
            ];
            plugins.length = 3;
            return plugins;
        }},
        configurable: true,
    }});

    // 3. 覆盖 navigator.languages
    Object.defineProperty(navigator, 'languages', {{
        get: () => {json.dumps(languages)},
        configurable: true,
    }});

    // 4. 覆盖 navigator.platform
    Object.defineProperty(navigator, 'platform', {{
        get: () => '{platform}',
        configurable: true,
    }});

    // 5. 覆盖 navigator.hardwareConcurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {{
        get: () => {hw_concurrency},
        configurable: true,
    }});

    // 6. 覆盖 navigator.deviceMemory
    Object.defineProperty(navigator, 'deviceMemory', {{
        get: () => {dev_memory},
        configurable: true,
    }});

    // 7. 放 chrome 对象（消除 headless 检测标志）
    if (!window.chrome) {{
        window.chrome = {{
            runtime: {{
                onMessage: {{ addListener: function() {{}}, removeListener: function() {{}} }},
                sendMessage: function() {{}},
                connect: function() {{ return {{ onMessage: {{ addListener: function() {{}} }}, postMessage: function() {{}} }}; }},
            }},
            loadTimes: function() {{ return {{}}; }},
            csi: function() {{ return {{}}; }},
            app: {{ isInstalled: false, InstallState: {{ DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }}, RunningState: {{ CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }} }},
        }};
    }}

    // 8. WebGL 指纹伪装
    const getParameterProxyHandler = {{
        apply: function(target, thisArg, args) {{
            const param = args[0];
            // UNMASKED_VENDOR_WEBGL
            if (param === 0x9245) return '{webgl["vendor"]}';
            // UNMASKED_RENDERER_WEBGL
            if (param === 0x9246) return '{webgl["renderer"]}';
            return Reflect.apply(target, thisArg, args);
        }},
    }};

    // 覆盖 WebGL getParameter
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attributes) {{
        const ctx = origGetContext.call(this, type, attributes);
        if (ctx && (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl')) {{
            if (!ctx.__parameterPatched) {{
                ctx.getParameter = new Proxy(ctx.getParameter, getParameterProxyHandler);
                ctx.__parameterPatched = true;
            }}
        }}
        return ctx;
    }};

    // 9. Canvas 指纹扰动（加入微小噪声）
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {{
        const ctx = this.getContext('2d');
        if (ctx && this.width > 0 && this.height > 0) {{
            try {{
                const imageData = ctx.getImageData(0, 0, Math.min(this.width, 4), Math.min(this.height, 4));
                for (let i = 0; i < imageData.data.length; i += 4) {{
                    imageData.data[i] = imageData.data[i] ^ (Math.random() > 0.5 ? 1 : 0);
                }}
                ctx.putImageData(imageData, 0, 0);
            }} catch(e) {{}}
        }}
        return origToDataURL.apply(this, arguments);
    }};

    // 10. AudioContext 指纹扰动
    if (window.AudioContext || window.webkitAudioContext) {{
        const OrigAudioContext = window.AudioContext || window.webkitAudioContext;
        const origCreateOscillator = OrigAudioContext.prototype.createOscillator;
        OrigAudioContext.prototype.createOscillator = function() {{
            const osc = origCreateOscillator.apply(this, arguments);
            const origConnect = osc.connect.bind(osc);
            osc.connect = function(dest) {{
                if (dest && dest.gain) {{
                    dest.gain.value = dest.gain.value + (Math.random() * 0.0001);
                }}
                return origConnect(dest);
            }};
            return osc;
        }};
    }}

    // 11. 屏幕属性
    Object.defineProperty(screen, 'width', {{ get: () => {screen["width"]}, configurable: true }});
    Object.defineProperty(screen, 'height', {{ get: () => {screen["height"]}, configurable: true }});
    Object.defineProperty(screen, 'availWidth', {{ get: () => {screen["width"]}, configurable: true }});
    Object.defineProperty(screen, 'availHeight', {{ get: () => {screen["height"] - 40}, configurable: true }});
    Object.defineProperty(screen, 'colorDepth', {{ get: () => {color_depth}, configurable: true }});
    Object.defineProperty(screen, 'pixelDepth', {{ get: () => {color_depth}, configurable: true }});
    Object.defineProperty(window, 'devicePixelRatio', {{ get: () => {pixel_ratio}, configurable: true }});

    // 12. 隐藏自动化标志
    delete navigator.__proto__.webdriver;

    // 13. Permissions API 伪装
    const origQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = function(parameters) {{
        if (parameters.name === 'notifications') {{
            return Promise.resolve({{ state: Notification.permission }});
        }}
        return origQuery.apply(this, arguments);
    }};

    // 14. 消除 iframe contentWindow 检测
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {{
        get: function() {{
            return window;
        }},
    }});

    console.log('[Stealth] 指纹注入完成');
    """


# ==========================================
# 浏览器创建与管理
# ==========================================

class StealthBrowser:
    """指纹浏览器管理器"""

    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.fingerprint: Optional[Dict[str, Any]] = None

    async def launch(self, proxy_url: str = None, headless: bool = None) -> Page:
        """启动一个全新的指纹浏览器实例"""
        if headless is None:
            headless = HEADLESS

        # 生成随机指纹
        self.fingerprint = _generate_fingerprint()
        fp = self.fingerprint

        print(f"[浏览器] 用户代理: {fp['user_agent'][:60]}...")
        print(f"[浏览器] 分辨率: {fp['screen']['width']}x{fp['screen']['height']}")
        print(f"[浏览器] 时区: {fp['timezone']}")
        print(f"[浏览器] WebGL 渲染器: {fp['webgl']['renderer'][:50]}...")

        self.playwright = await async_playwright().start()

        # Chromium 启动参数
        launch_args = [
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--disable-extensions",
            "--disable-default-apps",
            "--disable-component-update",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-background-networking",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-hang-monitor",
            "--disable-ipc-flooding-protection",
            "--disable-popup-blocking",
            "--disable-prompt-on-repost",
            "--disable-sync",
            "--disable-translate",
            "--metrics-recording-only",
            "--no-service-autorun",
            "--password-store=basic",
            "--use-mock-keychain",
            f"--window-size={fp['screen']['width']},{fp['screen']['height']}",
            f"--lang={fp['languages'][0]}",
        ]

        # 浏览器代理
        proxy_config = None
        effective_proxy = proxy_url or PROXY_URL
        if effective_proxy:
            proxy_config = {"server": effective_proxy}

        self.browser = await self.playwright.chromium.launch(
            headless=headless,
            slow_mo=SLOW_MO,
            args=launch_args,
            ignore_default_args=["--enable-automation"],
        )

        # 创建上下文（带指纹）
        context_options = {
            "viewport": {
                "width": fp["screen"]["width"],
                "height": fp["screen"]["height"],
            },
            "user_agent": fp["user_agent"],
            "locale": fp["languages"][0],
            "timezone_id": fp["timezone"],
            "color_scheme": random.choice(["light", "dark", "no-preference"]),
            "device_scale_factor": fp["pixel_ratio"],
            "has_touch": False,
            "is_mobile": False,
            "java_script_enabled": True,
            "bypass_csp": False,
            "ignore_https_errors": True,
            "extra_http_headers": {
                "Accept-Language": ", ".join(fp["languages"]) + ";q=0.9",
                "sec-ch-ua": fp["sec_ch_ua"],
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": f'"{fp["platform"]}"' if "Win" in fp["platform"] else f'"{fp["platform"]}"',
            },
        }

        if proxy_config:
            context_options["proxy"] = proxy_config

        self.context = await self.browser.new_context(**context_options)

        # 设置默认超时
        self.context.set_default_timeout(BROWSER_TIMEOUT)
        self.context.set_default_navigation_timeout(BROWSER_TIMEOUT)

        # 注入 stealth 脚本到每个新页面
        stealth_js = _build_stealth_js(fp)
        await self.context.add_init_script(stealth_js)

        # 使用 playwright-stealth v2 hook 上下文
        stealth = Stealth()
        await stealth.apply_stealth_async(self.context)

        # 创建页面
        self.page = await self.context.new_page()

        # 拦截 navigator.webdriver 的最终清理
        await self.page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined, configurable: true
            });
        """)

        print("[浏览器] ✓ 指纹浏览器启动完成")
        return self.page

    async def close(self):
        """关闭浏览器"""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
        except Exception:
            pass
        self.page = None
        self.context = None
        self.browser = None
        self.playwright = None
        print("[浏览器] 浏览器已关闭")

    async def new_page(self) -> Page:
        """在当前上下文中创建新页面"""
        if not self.context:
            raise RuntimeError("浏览器未启动")
        page = await self.context.new_page()
        return page

    def get_fingerprint(self) -> Dict[str, Any]:
        """获取当前浏览器指纹信息"""
        return self.fingerprint or {}
