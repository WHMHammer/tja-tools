# TJA工具

中文 [English](README-EN.md)

将 `.tja` 文件转化为图片。由 [Snack](https://github.com/Snack-X) 的 [tja-tools](https://github.com/Snack-X/tja-tools) 分叉。

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
- [ ] 并列显示不同分歧轨道
- [ ] 并列显示不同玩家谱面
- 元信息（通用）
    - [x] `TITLE`
    - [x] `SUBTITLE`
    - [x] `BPM`
    - [x] `MAKER`
    - [ ] `GENRE`
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
    - [x] `TTROWBEAT`（图像化用，单行最大拍数）
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
    - [x] `#BRANCHSTART` (仅显示最难分支)
    - [x] `#N`
    - [x] `#E`
    - [x] `#M`
    - [x] `#BRANCHEND`
    - [ ] `#LYRIC`
    - [ ] `#LEVELHOLD`
    - [ ] `#NEXTSONG`
    - [x] `#TTBREAK`（图像化用，在本小节首换行）

# 致谢

- [Snack](https://github.com/Snack-X)：项目的原作者
- [申しコミ](https://github.com/0auBSQ)：添加了对`A`、`B`、`C`、`F`、`G`音符的支持
- [Wei-Cheng Yeh (IID)](https://github.com/IepIweidieng)：添加了对`#BARLINEOFF`、`#BARLINEON`的支持
