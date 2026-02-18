// i18n.js - 国际化模块
// 支持英语、日语、简体中文

const translations = {
    en: {
        // 编辑器区域
        'editor.title': 'Editor (Drag and drop or <label for="tja-file">choose</label> a .TJA file)',
        'editor.zip.select': 'Select TJA file from ZIP:',
        'editor.zip.load': 'Load Selected',
        'editor.zip.cancel': 'Cancel',
        'editor.encoding': 'Encoding:',
        'editor.encoding.auto': 'Auto',
        'editor.live': 'Live-editing',
        'editor.process': 'Process',
        'editor.download': 'Download',
        'editor.copy': 'Copy',
        'editor.copy.error': 'Failed to copy text. Please check the security settings of your browser.',
        
        // 错误区域
        'errors.title': 'Errors',
        
        // 页脚
        'footer.source': 'Source Repo',
        
        // 控制区域
        'controls.unique': 'Generate <code>uniqueID.json</code>',
        'controls.download': 'Download as image',
        'controls.preview': 'Preview',
        'controls.statistics': 'Statistics',
        'controls.autoscroll': 'Auto scroll-to-bottom',
        'controls.embed': 'Embed Donscore notation',
        
        // 统计页面
        'stats.title': 'Statistics',
        'stats.save': 'Save Donscore notation',
        'stats.difficulty': 'Difficulty',
        'stats.branch': 'Branch',
        'stats.branch.normal': 'Normal',
        'stats.branch.professional': 'Professional',
        'stats.branch.master': 'Master',
        'stats.combo': 'Max Combo',
        'stats.score': 'Score',
        'stats.score.shinuchi': 'Shin-uchi',
        'stats.score.from_file': 'From TJA file',
        'stats.score.calculate': 'Calculate: ',
        'stats.notes.ratio': 'Ratio of Notes',
        'stats.notes.don': 'Don',
        'stats.notes.don_big': 'DON',
        'stats.notes.ka': 'Ka',
        'stats.notes.ka_big': 'KA',
        'stats.notes.kadon': 'KADON',
        'stats.adlibs': 'ADLibs Mines',
        'stats.adlib': 'ADLibs',
        'stats.mine': 'Mines',
        'stats.density': 'Average Density',
        'stats.density.unit': 'hit/s',
        'stats.density.time': 'in',
        'stats.density.seconds': 's',
        'stats.drumrolls': 'Drumrolls',
        'stats.copy': 'Copy (Japanese)',
        'stats.balloons': 'Balloons',
        'stats.graph': 'Density Graph',
        
        // 难度
        'difficulty.easy': 'Easy',
        'difficulty.normal': 'Normal',
        'difficulty.hard': 'Hard',
        'difficulty.oni': 'Oni',
        'difficulty.edit': 'Edit',
        
        // 单位
        'unit.points': ' Points',
        'unit.hits': 'hit(s)',
        'unit.hps': 'hit/s',
        'unit.min': 'm',
        'unit.sec': 's'
    },
    
    ja: {
        // 编辑器区域
        'editor.title': 'エディタ (tjaファイルをドラッグ＆ドロップするか<label for="tja-file">選択</label>してください)',
        'editor.zip.select': 'ZIPファイルからTJAファイルを選択:',
        'editor.zip.load': '選択したファイルを読み込み',
        'editor.zip.cancel': 'キャンセル',
        'editor.encoding': '文字コード: ',
        'editor.encoding.auto': '自動認識',
        'editor.live': '自動反映',
        'editor.process': '反映',
        'editor.download': '保存',
        'editor.copy': 'コピー',
        'editor.copy.error': 'テキストのコピーに失敗しました。ブラウザのセキュリティ設定を確認してください。',
        
        // 错误区域
        'errors.title': 'エラー',
        
        // 页脚
        'footer.source': 'リポジトリ',
        
        // 控制区域
        'controls.unique': '<code>uniqueID.json</code>を生成',
        'controls.download': '画像に保存',
        'controls.preview': 'プレビュー',
        'controls.statistics': '統計',
        'controls.autoscroll': '下へ自動スクロールする',
        'controls.embed': 'どんすこあ構文を埋め込む',
        
        // 统计页面
        'stats.title': '統計',
        'stats.save': 'どんすこあ構文を保存',
        'stats.difficulty': '難易度',
        'stats.branch': '分岐',
        'stats.branch.normal': '普通',
        'stats.branch.professional': '玄人',
        'stats.branch.master': '達人',
        'stats.combo': '最大コンボ数',
        'stats.score': '配点',
        'stats.score.shinuchi': '真打',
        'stats.score.from_file': '配点をテキストから',
        'stats.score.calculate': '予測する：',
        'stats.notes.ratio': 'ノーツの割合',
        'stats.notes.don': '小',
        'stats.notes.don_big': '大',
        'stats.notes.ka': '小',
        'stats.notes.ka_big': '大',
        'stats.notes.kadon': 'カドン',
        'stats.adlibs': 'ADLib・爆弾',
        'stats.adlib': 'ADLib',
        'stats.mine': '爆弾',
        'stats.density': '平均密度',
        'stats.density.unit': '打/秒',
        'stats.density.time': '演奏時間',
        'stats.density.seconds': ' 秒',
        'stats.drumrolls': '連打',
        'stats.copy': 'コピー',
        'stats.balloons': '風船',
        'stats.graph': '密度グラフ',
        
        // 难度
        'difficulty.easy': 'かんたん',
        'difficulty.normal': 'ふつう',
        'difficulty.hard': 'むずかしい',
        'difficulty.oni': 'おに',
        'difficulty.edit': 'おに裏',
        
        // 单位
        'unit.points': '点',
        'unit.hits': '打',
        'unit.hps': '打/秒',
        'unit.min': '分',
        'unit.sec': '秒'
    },
    
    'zh-cn': {
        // 编辑器区域
        'editor.title': '编辑器（拖拽或<label for="tja-file">选择</label>一个 .TJA 文件）',
        'editor.zip.select': '从ZIP文件中选择TJA文件：',
        'editor.zip.load': '加载选中文件',
        'editor.zip.cancel': '取消',
        'editor.encoding': '编码：',
        'editor.encoding.auto': '自动',
        'editor.live': '实时编辑',
        'editor.process': '处理',
        'editor.download': '下载',
        'editor.copy': '复制',
        'editor.copy.error': '文本复制失败。请确认浏览器的安全设定。',
        
        // 错误区域
        'errors.title': '错误',
        
        // 页脚
        'footer.source': '源码仓库',
        
        // 控制区域
        'controls.unique': '生成 <code>uniqueID.json</code>',
        'controls.download': '下载为图片',
        'controls.preview': '预览',
        'controls.statistics': '统计',
        'controls.autoscroll': '自动滚动到底部',
        'controls.embed': '嵌入Donscore记谱法',
        
        // 统计页面
        'stats.title': '统计',
        'stats.save': '保存Donscore记谱法',
        'stats.difficulty': '难度',
        'stats.branch': '分支',
        'stats.branch.normal': '普通',
        'stats.branch.professional': '专业',
        'stats.branch.master': '达人',
        'stats.combo': '最大连击数',
        'stats.score': '分数',
        'stats.score.shinuchi': '真打',
        'stats.score.from_file': '从TJA文件',
        'stats.score.calculate': '计算：',
        'stats.notes.ratio': '音符比例',
        'stats.notes.don': '咚',
        'stats.notes.don_big': '大咚',
        'stats.notes.ka': '咔',
        'stats.notes.ka_big': '大咔',
        'stats.notes.kadon': '咔咚',
        'stats.adlibs': '随意打击·炸弹',
        'stats.adlib': '随意打击',
        'stats.mine': '炸弹',
        'stats.density': '平均密度',
        'stats.density.unit': '击/秒',
        'stats.density.time': '演奏时间',
        'stats.density.seconds': ' 秒',
        'stats.drumrolls': '连击',
        'stats.copy': '复制（日文）',
        'stats.balloons': '气球',
        'stats.graph': '密度图表',
        
        // 难度
        'difficulty.easy': '简单',
        'difficulty.normal': '普通',
        'difficulty.hard': '困难',
        'difficulty.oni': '鬼',
        'difficulty.edit': '编辑',
        
        // 单位
        'unit.points': '分',
        'unit.hits': '击',
        'unit.hps': '击/秒',
        'unit.min': '分',
        'unit.sec': '秒'
    }
};

class I18n {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = translations;
    }
    
    // 设置当前语言
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            this.updateDOM();
        }
    }
    
    // 获取翻译文本
    t(key) {
        const translation = this.translations[this.currentLanguage];
        return translation && translation[key] ? translation[key] : key;
    }
    
    // 更新DOM中所有带有data-i18n属性的元素
    updateDOM() {
        // 更新所有带有 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.innerHTML = this.t(key);
        });
        
        // 更新HTML lang属性
        document.documentElement.setAttribute('lang', this.currentLanguage);
        
        // 触发自定义事件，通知其他模块语言已更改
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    }
    
    // 获取当前语言
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// 创建全局i18n实例
const i18n = new I18n();

// 导出i18n实例和相关函数
export { i18n };
export const t = (key) => i18n.t(key);
export const setLanguage = (lang) => i18n.setLanguage(lang);
export const getCurrentLanguage = () => i18n.getCurrentLanguage();

// 难度类型转换函数（用于替换parseTJA.js中的函数）
export function difficultyTypeToString(difficultyType) {
    switch (difficultyType) {
        case 0: return i18n.t('difficulty.easy');
        case 1: return i18n.t('difficulty.normal');
        case 2: return i18n.t('difficulty.hard');
        case 3: return i18n.t('difficulty.oni');
        case 4: return i18n.t('difficulty.edit');
    }
    return 'Unknown';
}
