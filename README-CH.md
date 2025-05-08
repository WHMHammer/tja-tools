# TJA工具

[日本語](README.md) 中文 [English](README-EN.md)

将 `.tja` 文件转化为图片。
由 [Snack](https://github.com/Snack-X) 的 [tja-tools](https://github.com/Snack-X/tja-tools) 分叉，
基于 [WHMHammer](https://github.com/WHMHammer) 的 [tja-tools](https://github.com/WHMHammer/tja-tools)（此分叉版本），
基于 [Dannal65535](https://github.com/Dannal65535) 的 [tja-tools](https://github.com/Dannal65535/tja-tools)，
基于 [sakurada0291](https://github.com/sakurada0291) 的 [tja-tools-tl](https://github.com/sakurada0291/tja-tools-tl)。

## 运行

访问 https://whmhammer.github.io/tja-tools

## 构建

安装Node：https://nodejs.org/zh-cn/download，然后执行以下命令：

```
git clone https://github.com/WHMHammer/tja-tools
cd tja-tools
npm i
npm run build
```

接着在浏览器中打开 `webpack-dist/index.html`（注意不是`src/index.html`）或执行 `npm start`

## 示例

![](doc/img/示例.png)

![](doc/img/示例-春节序曲-谱面.png)

![](doc/img/示例-春节序曲-统计.png)

## 进度

- [x] 自选文件编码
- [x] 并列显示不同分歧轨道
- [ ] 并列显示不同玩家谱面
- 元信息（通用）
    - [x] `TITLE`
    - [x] `SUBTITLE`
    - [x] `BPM`
    - [x] `MAKER`
    - [x] `GENRE`
- 元信息（可各难度独立）
    - `COURSE`
        - [x] `Easy` / `0`
        - [x] `Normal` / `1`
        - [x] `Hard` / `2`
        - [x] `Oni` / `3`
        - [x] `Edit` / `Ura` / `4`
        - [ ] `Tower` / `5`
        - [ ] `Dan` / `6`
    - [x] `LEVEL`
    - [x] `BALLOON`
    - [x] `STYLE`（各玩家谱面显示为独立难度）
    - [x] `NOTESDESIGNER0` ~ `NOTESDESIGNER6` (仅0~4有效)
- 音符
    - [x] `0`（空）
    - [x] `1`（小咚）
    - [x] `2`（小咔）
    - [x] `3`（大咚）
    - [x] `4`（大咔）
    - [x] `5`（小滚奏开始）
    - [x] `6`（大滚奏开始）
    - [x] `7`（小气球开始）
    - [x] `8`（滚奏/气球结束）
    - [x] `9`（大气球开始）
    - [x] `A`（双人咚）
    - [x] `B`（双人咔）
    - [x] `C`（炸弹）
    - [x] `D`（紫色气球）
    - [x] `F`（隐藏音符）
    - [x] `G`（紫/绿音符）
    - [ ] `H`（大滚奏或小咚滚奏开始）
    - [ ] `I`（小滚奏或小咔滚奏开始）
- 指令
    - [x] `#START`
        - [x] `P1`, `P2`, …（无玩家编号上限）
    - [x] `#END`
    - [x] `#MEASURE`
    - [x] `#BPMCHANGE`
    - [ ] `#DELAY`
    - [x] `#SCROLL`
    - [x] `#GOGOSTART`
    - [x] `#GOGOEND`
    - [x] `#BARLINEOFF`
    - [x] `#BARLINEON`
    - [x] `#BRANCHSTART`
    - [x] `#N`
    - [x] `#E`
    - [x] `#M`
    - [x] `#BRANCHEND`
    - [ ] `#LYRIC`
    - [ ] `#LEVELHOLD`
    - [ ] `#NEXTSONG`

## 额外指令

- 元信息（通用）
    - `FONT` ([Dannal65535](https://github.com/Dannal65535))
    更改歌曲标题和难度的字体。
        - `sans-serif`
        TJA Tools 最初使用的字体。可用 `sans-serif` 指定。
    - `TITLECOLOR` ([Dannal65535](https://github.com/Dannal65535))
    将其设置为 1 或 2 时，将根据歌曲分类更改歌曲标题的颜色。

    1 为较深的颜色，2 为较浅的颜色。
    - `LEVELCOLOR` ([Dannal65535](https://github.com/Dannal65535))
    将其设置为 1 或 2 时，将根据难度名更改难度文本的颜色。
    设置为 1 时，里魔王难度将与魔王难度的颜色相同。
    - `LEVELURA` ([Dannal65535](https://github.com/Dannal65535))
    设置为 1 可更改里魔王难度的文字组合。
    默认情况下，歌曲名称后会加上 `(裏譜面)`（裏谱面），难度名为 `おに`（魔王）。
    将指令的值设置为 1，歌曲名称将保持不变，难度名为 `おに裏`（里魔王）。
    - `SPROLL` ([Dannal65535](https://github.com/Dannal65535))
    将彩球音符的起点更改为其他特殊音符。
        - `potato`
        更改为地瓜音符。
        - `denden`
        更改为撥浪鼓音符。
        - `suzudon`
        更改为铃音符。

- 元信息（可各难度独立）
    - `TTROWBEAT` ([Snack](https://github.com/Snack-X))
    将单行最大拍数从预设 16 拍改为其他指定拍数。

- 指令
    - `#TTBREAK` ([Snack](https://github.com/Snack-X)), \
    `#NEWLINE` ([Dannal65535](https://github.com/Dannal65535))
    在指令所在的小节开头换行。
    除了原先已有的 `#TTBREAK` 外，
    现在还支持 Donscore 的 `#newline`。
    - `#MOVEEVENT` ([Dannal65535](https://github.com/Dannal65535))
    移动此指令后的 BPM 和 HS 信息的垂直位置（Y 坐标）。
    - `#COUNTCHANGE` ([Dannal65535](https://github.com/Dannal65535))
    更改此指令后下一小节起的编号。
    - `#AVOIDTEXTOFF`、`#AVOIDTEXTON` ([Dannal65535](https://github.com/Dannal65535))
    此指令后的垂直线会避免与 BPM 和 HS 信息重叠。

## 功能

- 编辑器
    - 实时编辑 ([Snack](https://github.com/Snack-X))
    启用时，编辑 TJA 文本时，将自动更新预览和统计页面，无需点击处理按钮。
    - 自动向下滚动 ([WHMHammer](https://github.com/WHMHammer))
    启用时，编辑 TJA 文本时，预览和统计页面会自动向下滚动到底。
    - 自选和自动检测文件编码 ([WHMHammer](https://github.com/WHMHammer))
    - 嵌入 Donscore 谱面文本 ([Dannal65535](https://github.com/Dannal65535))
    在预览图片的标头中嵌入 Donscore 谱面文本。
    如果未勾选，则将嵌入所选难度的 TJA 谱面文本。
    无论哪种情况，都可以使用 `reverse.exe` 将其提取为文本文件。
    - 切换语言 ([Wei-Cheng Yeh (IID)](https://github.com/IepIweidieng))

- 预览
    - 生成用于 OpenTaiko 的 `uniqueId.json` ([申しコミ](https://github.com/0auBSQ))
    - 在手机上保存图片 ([申しコミ](https://github.com/0auBSQ)、[Dannal65535](https://github.com/Dannal65535))

- 统计
    - 保存 Donscore 谱面文本 ([Dannal65535](https://github.com/Dannal65535))
    将 Donscore 谱面文本保存为文件。

    - 难度星级 ([Dannal65535](https://github.com/Dannal65535))
    难度星级会显示在统计中。

    - 支持谱面分歧 ([Dannal65535](https://github.com/Dannal65535))
    现在可以通过选择分歧查看各个分歧的统计数据。

    - BPM ([Dannal65535](https://github.com/Dannal65535))
    会显示最小 BPM 和最大 BPM。

    - 分数 ([Snack](https://github.com/Snack-X))
    除了 AC15 配分外，现在还支持真打和 AC16 配分。([Dannal65535](https://github.com/Dannal65535))
    现在可以选择 AC15 或 RC 的 Go-Go 段配分舍入方式。([Dannal65535](https://github.com/Dannal65535))
    现在支持预测配分参数。 ([Dannal65535](https://github.com/Dannal65535))

    - 平均密度 ([Snack](https://github.com/Snack-X))
    TJA Tools 计算平均密度的公式原为“(音符数)/演奏时间”，
    不过现已更改为 [譜面とかWiki](https://wikiwiki.jp/taiko-fumen) 所用的“(音符数-1)/演奏时间”。 ([Dannal65535](https://github.com/Dannal65535))

    - 复制连打文本 ([Dannal65535](https://github.com/Dannal65535))
    点击标题旁边的复制按钮，
    即可复制按照 [譜面とかWiki](https://wikiwiki.jp/taiko-fumen) 所用的格式格式化的连打秒数文本。

# 致谢

- [Snack](https://github.com/Snack-X)：项目的原作者
- [WHMHammer](https://github.com/WHMHammer)：此分叉版本的主要维护者，添加了初始英文翻译
- [申しコミ](https://github.com/0auBSQ)：添加了对`A`、`B`、`C`、`D`、`F`、`G`音符的支持，添加了次标题与谱面制作者的显示
- [Dannal65535](https://github.com/Dannal65535)：添加了并列显示不同分歧轨道的支持，使预览图片与 Donscore 兼容，添加了日语翻译
- [sakurada0291](https://github.com/sakurada0291)：添加了英文翻译
