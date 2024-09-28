# TJA工具

中文 [English](README-EN.md)

将`.tja`文件转化为图片。由[Snack](https://github.com/Snack-X)的[tja-tools](https://github.com/Snack-X/tja-tools)分叉。

## 运行

访问[https://whmhammer.github.io/tja-tools](https://whmhammer.github.io/tja-tools)

## 构建

安装Node v14：

```
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 14.19.1
```

克隆代码库：

```
git clone https://github.com/WHMHammer/tja-tools
cd tja-tools
```

安装其它依赖：

```
npm install
```

构建：

```
npm run build
```

接着在浏览器中打开`index.html`（注意不是`src/index.html`）。

## 示例

![](doc/img/示例.png)

![](doc/img/示例-春节序曲-谱面.png)

![](doc/img/示例-春节序曲-统计.png)

## 进度

- [x] 自选文件编码
- [ ] 并列显示不同分歧轨道
- 元信息（通用）
    - [x] `TITLE`
    - [ ] `SUBTITLE`
    - [x] `BPM`
    - [ ] `GENRE`
- 元信息（各难度独立）
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
    - [ ] `STYLE`
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
- 指令
    - [x] `#START`
    - [x] `#END`
    - [x] `#MEASURE`
    - [x] `#BPMCHANGE`
    - [ ] `#DELAY`
    - [x] `#SCROLL`
    - [x] `#GOGOSTART`
    - [x] `#GOGOEND`
    - [ ] `#BARLINEOFF`
    - [ ] `#BARLINEON`
    - [x] `#BRANCHSTART` (仅显示最难分支)
    - [x] `#N`
    - [x] `#E`
    - [x] `#M`
    - [x] `#BRANCHEND`
    - [ ] `#LYRIC`
    - [ ] `#LEVELHOLD`
    - [ ] `#NEXTSONG`
# 致谢

- [Snack](https://github.com/Snack-X)：项目的原作者
- [申しコミ](https://github.com/0auBSQ)：添加了对`A`、`B`、`C`、`F`、`G`音符的支持
