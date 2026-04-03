"""
人类行为模拟模块
模拟真实人类的鼠标移动、打字、滚动、等待等行为
减少自动化检测痕迹
"""

import math
import random
import asyncio
from typing import Optional, Tuple


class HumanSimulator:
    """模拟人类操作行为的工具类"""

    def __init__(self, page):
        self.page = page

    # ==========================================
    # 贝塞尔曲线鼠标移动
    # ==========================================

    @staticmethod
    def _bezier_curve(
        start: Tuple[float, float],
        end: Tuple[float, float],
        num_points: int = 30,
    ) -> list:
        """生成贝塞尔曲线路径点，模拟人类鼠标移动轨迹"""
        sx, sy = start
        ex, ey = end

        # 生成 1-2 个随机控制点
        dist = math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2)
        offset = max(dist * 0.3, 20)

        # 控制点1: 起点附近偏移
        cp1x = sx + (ex - sx) * random.uniform(0.2, 0.4) + random.uniform(-offset, offset)
        cp1y = sy + (ey - sy) * random.uniform(0.2, 0.4) + random.uniform(-offset, offset)

        # 控制点2: 终点附近偏移
        cp2x = sx + (ex - sx) * random.uniform(0.6, 0.8) + random.uniform(-offset * 0.5, offset * 0.5)
        cp2y = sy + (ey - sy) * random.uniform(0.6, 0.8) + random.uniform(-offset * 0.5, offset * 0.5)

        points = []
        for i in range(num_points + 1):
            t = i / num_points
            # 三次贝塞尔曲线公式
            u = 1 - t
            x = u**3 * sx + 3 * u**2 * t * cp1x + 3 * u * t**2 * cp2x + t**3 * ex
            y = u**3 * sy + 3 * u**2 * t * cp1y + 3 * u * t**2 * cp2y + t**3 * ey
            points.append((x, y))

        return points

    async def move_mouse_human(self, target_x: float, target_y: float):
        """像人类一样移动鼠标到目标位置"""
        # 获取当前鼠标大致位置（用页面中心作为默认起点）
        viewport = self.page.viewport_size or {"width": 1280, "height": 720}
        start_x = random.uniform(viewport["width"] * 0.2, viewport["width"] * 0.8)
        start_y = random.uniform(viewport["height"] * 0.2, viewport["height"] * 0.8)

        # 生成路径
        num_points = random.randint(15, 40)
        path = self._bezier_curve((start_x, start_y), (target_x, target_y), num_points)

        # 沿路径移动，速度有变化（开始慢、中间快、结束慢）
        for i, (x, y) in enumerate(path):
            progress = i / len(path)
            # 速度曲线：缓入缓出
            if progress < 0.2:
                delay = random.uniform(8, 20)  # 开始慢
            elif progress > 0.8:
                delay = random.uniform(10, 25)  # 结束慢
            else:
                delay = random.uniform(3, 10)  # 中间快

            await self.page.mouse.move(x, y)
            await asyncio.sleep(delay / 1000)

    # ==========================================
    # 人类化点击
    # ==========================================

    async def click_element_human(self, selector: str, timeout: int = 10000):
        """像人类一样点击元素（带随机偏移 + 鼠标移动）"""
        element = await self.page.wait_for_selector(selector, timeout=timeout, state="visible")
        if not element:
            raise Exception(f"元素未找到: {selector}")

        # 获取元素位置和大小
        box = await element.bounding_box()
        if not box:
            # fallback：直接点击
            await element.click()
            return

        # 在元素区域内随机选择一个点击位置（不精确到中心）
        click_x = box["x"] + box["width"] * random.uniform(0.2, 0.8)
        click_y = box["y"] + box["height"] * random.uniform(0.25, 0.75)

        # 人类化鼠标移动
        await self.move_mouse_human(click_x, click_y)

        # 短暂停顿后点击（人类在点击前总会稍微停顿）
        await asyncio.sleep(random.uniform(0.05, 0.2))

        # 点击（按下和松开之间有微小间隔）
        await self.page.mouse.down()
        await asyncio.sleep(random.uniform(0.03, 0.12))
        await self.page.mouse.up()

        # 点击后短暂等待
        await asyncio.sleep(random.uniform(0.2, 0.6))

    async def click_coordinates_human(self, x: float, y: float):
        """像人类一样点击指定坐标"""
        await self.move_mouse_human(x, y)
        await asyncio.sleep(random.uniform(0.05, 0.2))
        await self.page.mouse.down()
        await asyncio.sleep(random.uniform(0.03, 0.12))
        await self.page.mouse.up()
        await asyncio.sleep(random.uniform(0.2, 0.5))

    # ==========================================
    # 人类化打字
    # ==========================================

    async def type_text_human(self, selector: str, text: str, timeout: int = 10000):
        """像人类一样在输入框中打字"""
        # 先点击输入框
        await self.click_element_human(selector, timeout=timeout)
        await asyncio.sleep(random.uniform(0.3, 0.8))

        # 逐字符输入
        for i, char in enumerate(text):
            # 基础打字间隔：50-180ms
            delay = random.uniform(0.05, 0.18)

            # 偶尔有较长停顿（像是在思考）
            if random.random() < 0.05:
                delay += random.uniform(0.3, 0.8)

            # 连续相同字符或数字时打快一些
            if i > 0 and (char == text[i-1] or (char.isdigit() and text[i-1].isdigit())):
                delay *= 0.6

            await self.page.keyboard.press(char)
            await asyncio.sleep(delay)

        # 打完后短暂停顿
        await asyncio.sleep(random.uniform(0.2, 0.5))

    async def type_with_mistakes(self, selector: str, text: str, mistake_rate: float = 0.03):
        """带偶尔打错字的打字效果（更像人类）"""
        await self.click_element_human(selector)
        await asyncio.sleep(random.uniform(0.3, 0.8))

        i = 0
        while i < len(text):
            char = text[i]

            # 小概率打错字
            if random.random() < mistake_rate and char.isalpha():
                # 打一个临近键位的错误字符
                wrong_char = self._nearby_key(char)
                await self.page.keyboard.press(wrong_char)
                await asyncio.sleep(random.uniform(0.1, 0.3))

                # 发现错误，删除
                await asyncio.sleep(random.uniform(0.15, 0.5))
                await self.page.keyboard.press("Backspace")
                await asyncio.sleep(random.uniform(0.1, 0.2))

            # 正确输入
            await self.page.keyboard.press(char)
            delay = random.uniform(0.05, 0.18)
            if random.random() < 0.05:
                delay += random.uniform(0.3, 0.8)
            await asyncio.sleep(delay)
            i += 1

        await asyncio.sleep(random.uniform(0.2, 0.5))

    @staticmethod
    def _nearby_key(char: str) -> str:
        """获取键盘上临近的按键（用于模拟打字错误）"""
        keyboard_neighbors = {
            'a': 'sq', 'b': 'vn', 'c': 'xv', 'd': 'sf', 'e': 'wr',
            'f': 'dg', 'g': 'fh', 'h': 'gj', 'i': 'uo', 'j': 'hk',
            'k': 'jl', 'l': 'k', 'm': 'n', 'n': 'bm', 'o': 'ip',
            'p': 'o', 'q': 'wa', 'r': 'et', 's': 'ad', 't': 'ry',
            'u': 'yi', 'v': 'cb', 'w': 'qe', 'x': 'zc', 'y': 'tu',
            'z': 'x',
        }
        lower = char.lower()
        neighbors = keyboard_neighbors.get(lower, lower)
        result = random.choice(neighbors)
        return result.upper() if char.isupper() else result

    # ==========================================
    # 人类化滚动
    # ==========================================

    async def scroll_page_human(self, direction: str = "down", amount: int = 300):
        """像人类一样滚动页面"""
        # 分多次小幅滚动
        total = 0
        while total < amount:
            step = random.randint(30, 100)
            step = min(step, amount - total)
            delta = step if direction == "down" else -step
            await self.page.mouse.wheel(0, delta)
            total += step
            await asyncio.sleep(random.uniform(0.02, 0.08))

        # 滚动完后稍作停留（像是在阅读）
        await asyncio.sleep(random.uniform(0.5, 1.5))

    # ==========================================
    # 随机等待
    # ==========================================

    async def random_wait(self, min_sec: float = 0.5, max_sec: float = 2.0):
        """随机等待一段时间"""
        await asyncio.sleep(random.uniform(min_sec, max_sec))

    async def thinking_pause(self):
        """模拟人类思考停顿（较长等待）"""
        await asyncio.sleep(random.uniform(1.0, 3.5))

    async def short_pause(self):
        """短暂停顿"""
        await asyncio.sleep(random.uniform(0.2, 0.8))

    # ==========================================
    # 随机页面交互（增加真实感）
    # ==========================================

    async def random_mouse_movement(self):
        """随机移动鼠标（模拟人类无意识的鼠标移动）"""
        viewport = self.page.viewport_size or {"width": 1280, "height": 720}
        target_x = random.uniform(50, viewport["width"] - 50)
        target_y = random.uniform(50, viewport["height"] - 50)

        num_points = random.randint(5, 15)
        path = self._bezier_curve(
            (random.uniform(100, viewport["width"] - 100),
             random.uniform(100, viewport["height"] - 100)),
            (target_x, target_y),
            num_points,
        )
        for x, y in path:
            await self.page.mouse.move(x, y)
            await asyncio.sleep(random.uniform(0.005, 0.02))

    async def simulate_reading(self, seconds: float = None):
        """模拟人类阅读页面的行为"""
        if seconds is None:
            seconds = random.uniform(1.5, 4.0)

        # 期间偶尔移动鼠标
        elapsed = 0
        while elapsed < seconds:
            if random.random() < 0.3:
                await self.random_mouse_movement()
            wait = random.uniform(0.3, 1.0)
            await asyncio.sleep(wait)
            elapsed += wait

    async def focus_blur_input(self, selector: str):
        """模拟点击输入框然后移开（Focus/Blur 事件）"""
        await self.click_element_human(selector)
        await asyncio.sleep(random.uniform(0.2, 0.5))
        # 点击页面空白处（blur）
        viewport = self.page.viewport_size or {"width": 1280, "height": 720}
        await self.click_coordinates_human(
            random.uniform(10, 50),
            random.uniform(viewport["height"] - 50, viewport["height"] - 10),
        )
