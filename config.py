"""
全局配置模块
所有可调参数集中管理
"""

# ==========================================
# 代理设置
# ==========================================
PROXY_URL = "http://127.0.0.1:7890"  # HTTP 代理地址，留空则不使用代理

# ==========================================
# 邮箱源配置（与 register.py 保持一致）
# ==========================================
MAIL_SOURCES = {
    "tempmail_lol": True,   # tempmail.lol（域名不易被封，推荐）
    "onesecmail": False,    # 1secmail（被 CF 拦截，暂不可用）
    "duckmail": False,      # DuckMail（需 API Key）
    "mailtm": False,        # mail.gw（域名大多被封，仅兜底）
}

DUCKMAIL_KEY = ""

# ==========================================
# 临时邮箱 API 地址
# ==========================================
MAILTM_BASE = "https://api.mail.gw"
TEMPMAIL_LOL_BASE = "https://api.tempmail.lol/v2"
DUCKMAIL_BASE = "https://api.duckmail.sbs"
ONESECMAIL_BASE = "https://www.1secmail.com/api/v1/"

# ==========================================
# Sub2Api 自动推送
# ==========================================
SUB2API_ENABLED = True
SUB2API_URL = "http://35.81.99.93:8080"
SUB2API_EMAIL = "mrwilliam1721@gmail.com"
SUB2API_PASSWORD = "xfv!nvp!fxv4akc5TGH"

# ==========================================
# Clash Verge 自动切换节点
# ==========================================
CLASH_ENABLED = False
CLASH_API_URL = "http://127.0.0.1:9097"
CLASH_SECRET = "set-your-secret"
CLASH_PROXY_GROUP = "鹿语云"

# ==========================================
# OpenAI OAuth 配置
# ==========================================
AUTH_URL = "https://auth.openai.com/oauth/authorize"
TOKEN_URL = "https://auth.openai.com/oauth/token"
CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
DEFAULT_REDIRECT_URI = "http://localhost:1455/auth/callback"
DEFAULT_SCOPE = "openid email profile offline_access"

# ==========================================
# 注册参数
# ==========================================
MAX_REGISTER_COUNT = 30       # 默认注册数量
SLEEP_MIN = 5                 # 循环最短等待秒数
SLEEP_MAX = 30                # 循环最长等待秒数
WORKERS = 1                   # 并发线程数

# ==========================================
# 浏览器设置
# ==========================================
HEADLESS = False              # True = 无头模式, False = 显示界面
BROWSER_TIMEOUT = 60000       # 页面加载超时 (毫秒)
SLOW_MO = 0                   # Playwright slowMo (毫秒)

# ==========================================
# 随机姓名库
# ==========================================
FIRST_NAMES = [
    "James", "Mary", "John", "Emma", "Robert", "Sarah", "David", "Laura",
    "Michael", "Anna", "William", "Sophia", "Daniel", "Olivia", "Matthew",
    "Isabella", "Andrew", "Mia", "Joshua", "Charlotte", "Ethan", "Amelia",
    "Alexander", "Harper", "Ryan", "Evelyn", "Nathan", "Abigail", "Tyler",
    "Emily", "Brandon", "Elizabeth", "Jacob", "Chloe", "Kevin", "Grace",
    "Justin", "Victoria", "Christopher", "Natalie",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson",
    "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
    "Thompson", "White", "Harris", "Clark", "Lewis", "Robinson", "Walker",
    "Young", "King", "Wright", "Green", "Baker", "Adams", "Nelson", "Hill",
    "Campbell", "Mitchell", "Roberts", "Carter", "Phillips",
]

# ==========================================
# Clash 地区黑名单
# ==========================================
CLASH_BLOCK_KEYWORDS = [
    "香港", "HK", "Hong Kong", "澳门", "Macao",
    "台湾", "TW", "Taiwan", "中国", "CN",
]
