"""
简体中文提示词本地化
八字命理传统术语，简体中文 (大陆)
"""
from typing import Dict


class ChineseSimplifiedLocale:
    """简体中文本地化提示词配置 (zh-CN)"""

    LANGUAGE_CODE = 'zh-CN'
    LANGUAGE_NAME = '简体中文'

    # 语气风格
    TONE = "权威但亲切，专业但易懂"

    # 术语风格
    TERMINOLOGY_STYLE = "使用八字命理标准术语"

    # 古典引用风格
    CLASSICAL_QUOTE_STYLE = "古文原文 + 白话解读"

    # 十神术语
    TEN_GODS: Dict[str, str] = {
        "bijian": "比肩",
        "jiecai": "劫财",
        "shishen": "食神",
        "shangguan": "伤官",
        "zhengcai": "正财",
        "piancai": "偏财",
        "zhengguan": "正官",
        "qisha": "偏官/七杀",
        "zhengyin": "正印",
        "pianyin": "偏印/枭神",
    }

    # 五行术语
    ELEMENTS: Dict[str, str] = {
        "wood": "木",
        "fire": "火",
        "earth": "土",
        "metal": "金",
        "water": "水",
    }

    # 分析领域标签
    FOCUS_AREA_LABELS: Dict[str, str] = {
        "wealth": "财运",
        "love": "感情运",
        "career": "事业运",
        "health": "健康运",
        "overall": "综合运势",
    }

    # 分析领域说明
    FOCUS_AREA_DESCRIPTIONS: Dict[str, str] = {
        "wealth": "财富流向、投资时机、理财方向的详细分析。",
        "love": "姻缘时机、缘分特点、感情改善方法的分析。",
        "career": "职业适性、跳槽时机、晋升可能性的分析。",
        "health": "易患疾病、养生方法、注意时期的分析。",
        "overall": "人生整体走势和方向的综合分析。",
    }

    @classmethod
    def get_system_instruction(cls) -> str:
        """中文系统指令"""
        return """
## 语言与风格规范

### 语言
- 所有回答使用简体中文
- 使用正式但亲切的语气

### 专业术语
- 使用八字命理标准术语
- 直接使用汉字，无需注音（例：日干、用神、格局）
- 术语解释简洁明了

### 古典引用
- 引用子平真诠、穷通宝鉴等经典时，提供原文和白话解读
- 示例：「甲木参天，脱胎要火」—— 甲木高大参天，要脱胎换骨需要火来引发

### 语气与态度
- 权威而不高傲，专业而不晦涩
- 避免迷信或恐吓性表达
- 使用「可能」「倾向于」等留有余地的表述
- 负面信息也要提供解决方向
  - 不好的示例：「你会破财」
  - 好的示例：「这个时期财运需要特别注意，建议稳健理财，避免大额投资...」

### 建议风格
- 提供具体可执行的建议
- 明确时间、方法、方向
  - 不好的示例：「会有好事发生」
  - 好的示例：「2026年下半年，尤其是9-10月，有新机遇出现的迹象。建议在这个时期积极拓展人脉...」
"""

    @classmethod
    def get_pillars_format(cls) -> str:
        """四柱展示格式"""
        return """
## 四柱展示格式

以下列格式展示命盘信息：

### 四柱八字
| 时柱 | 日柱 | 月柱 | 年柱 |
|:----:|:----:|:----:|:----:|
| {时干} | {日干}★ | {月干} | {年干} |
| {时支} | {日支} | {月支} | {年支} |

★ 日干代表「命主本人」。
"""

    @classmethod
    def get_analysis_structure(cls) -> str:
        """分析结构指南"""
        return """
## 分析结构

1. **核心概要**（2-3句话）
   - 此命盘最突出的特点和优势

2. **性格分析**
   - 日干特性
   - 主要性格关键词3-5个
   - 优点与待改进之处

3. **各领域分析**（财运/感情/事业/健康）
   - 各领域评分（0-100）
   - 详细分析
   - 具体可行的建议

4. **五年运势预测**
   - 每年主题
   - 评分与关键建议

5. **经典引用**（1-3条）
   - 出处
   - 原文
   - 现代解读
"""

    @classmethod
    def build(cls) -> str:
        """构建完整中文本地化提示词"""
        parts = [
            cls.get_system_instruction(),
            cls.get_pillars_format(),
            cls.get_analysis_structure(),
        ]

        return "\n".join(parts)
