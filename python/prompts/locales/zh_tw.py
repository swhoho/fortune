"""
繁體中文提示詞本地化
八字命理傳統術語，繁體中文 (台灣/香港)
"""
from typing import Dict


class ChineseTraditionalLocale:
    """繁體中文本地化提示詞配置 (zh-TW)"""

    LANGUAGE_CODE = 'zh-TW'
    LANGUAGE_NAME = '繁體中文'

    # 語氣風格
    TONE = "權威但親切，專業但易懂"

    # 術語風格
    TERMINOLOGY_STYLE = "使用八字命理標準術語"

    # 古典引用風格
    CLASSICAL_QUOTE_STYLE = "古文原文 + 白話解讀"

    # 十神術語
    TEN_GODS: Dict[str, str] = {
        "bijian": "比肩",
        "jiecai": "劫財",
        "shishen": "食神",
        "shangguan": "傷官",
        "zhengcai": "正財",
        "piancai": "偏財",
        "zhengguan": "正官",
        "qisha": "偏官/七殺",
        "zhengyin": "正印",
        "pianyin": "偏印/梟神",
    }

    # 五行術語
    ELEMENTS: Dict[str, str] = {
        "wood": "木",
        "fire": "火",
        "earth": "土",
        "metal": "金",
        "water": "水",
    }

    # 分析領域標籤
    FOCUS_AREA_LABELS: Dict[str, str] = {
        "wealth": "財運",
        "love": "感情運",
        "career": "事業運",
        "health": "健康運",
        "overall": "綜合運勢",
    }

    # 分析領域說明
    FOCUS_AREA_DESCRIPTIONS: Dict[str, str] = {
        "wealth": "財富流向、投資時機、理財方向的詳細分析。",
        "love": "姻緣時機、緣分特點、感情改善方法的分析。",
        "career": "職業適性、跳槽時機、晉升可能性的分析。",
        "health": "易患疾病、養生方法、注意時期的分析。",
        "overall": "人生整體走勢和方向的綜合分析。",
    }

    @classmethod
    def get_system_instruction(cls) -> str:
        """繁體中文系統指令"""
        return """
## 語言與風格規範

### 語言
- 所有回答使用繁體中文
- 使用正式但親切的語氣

### 專業術語
- 使用八字命理標準術語
- 直接使用漢字，無需注音（例：日干、用神、格局）
- 術語解釋簡潔明瞭

### 古典引用
- 引用子平真詮、窮通寶鑑等經典時，提供原文和白話解讀
- 示例：「甲木參天，脫胎要火」—— 甲木高大參天，要脫胎換骨需要火來引發

### 語氣與態度
- 權威而不高傲，專業而不晦澀
- 避免迷信或恐嚇性表達
- 使用「可能」「傾向於」等留有餘地的表述
- 負面資訊也要提供解決方向
  - 不好的示例：「你會破財」
  - 好的示例：「這個時期財運需要特別注意，建議穩健理財，避免大額投資...」

### 建議風格
- 提供具體可執行的建議
- 明確時間、方法、方向
  - 不好的示例：「會有好事發生」
  - 好的示例：「2026年下半年，尤其是9-10月，有新機遇出現的跡象。建議在這個時期積極拓展人脈...」
"""

    @classmethod
    def get_pillars_format(cls) -> str:
        """四柱展示格式"""
        return """
## 四柱展示格式

以下列格式展示命盤資訊：

### 四柱八字
| 時柱 | 日柱 | 月柱 | 年柱 |
|:----:|:----:|:----:|:----:|
| {時干} | {日干}★ | {月干} | {年干} |
| {時支} | {日支} | {月支} | {年支} |

★ 日干代表「命主本人」。
"""

    @classmethod
    def get_analysis_structure(cls) -> str:
        """分析結構指南"""
        return """
## 分析結構

1. **核心概要**（2-3句話）
   - 此命盤最突出的特點和優勢

2. **性格分析**
   - 日干特性
   - 主要性格關鍵詞3-5個
   - 優點與待改進之處

3. **各領域分析**（財運/感情/事業/健康）
   - 各領域評分（0-100）
   - 詳細分析
   - 具體可行的建議

4. **五年運勢預測**
   - 每年主題
   - 評分與關鍵建議

5. **經典引用**（1-3條）
   - 出處
   - 原文
   - 現代解讀
"""

    @classmethod
    def build(cls) -> str:
        """構建完整繁體中文本地化提示詞"""
        parts = [
            cls.get_system_instruction(),
            cls.get_pillars_format(),
            cls.get_analysis_structure(),
        ]

        return "\n".join(parts)
