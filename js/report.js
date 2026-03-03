// 搞钱基因测试 — 报告生成 & 图表渲染
import { DIMENSIONS, DIMENSION_ANALYSIS, PERSONALITY_TYPES, ADVANTAGES_MAP, SUGGESTIONS_MAP } from './questions.js';

export class ReportGenerator {
    constructor() {
        this.gaugeChart = null;
        this.radarChart = null;
    }

    // 计算各维度分数
    calculateScores(answers) {
        const scores = { risk: 0, execution: 0, cognition: 0, network: 0, finance: 0 };
        answers.forEach(a => {
            scores[a.dimension] += a.score;
        });
        return scores;
    }

    // 计算总分（0-100）
    calculateTotalScore(scores) {
        const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
        // 最高 150分 (30题 × 5分)，最低 30分 (30题 × 1分)
        return Math.round(((total - 30) / 120) * 100);
    }

    // 匹配人格类型
    matchPersonality(scores) {
        // 先检查全能型（需要所有维度都高）
        const allround = PERSONALITY_TYPES.find(t => t.id === 'allround');
        if (allround.condition(scores)) return allround;

        // 按顺序检查其他类型
        for (const type of PERSONALITY_TYPES) {
            if (type.id === 'allround') continue;
            if (type.condition(scores)) return type;
        }
        // 兜底
        return PERSONALITY_TYPES[PERSONALITY_TYPES.length - 1];
    }

    // 计算击败百分比
    calculateBeatPercent(totalScore) {
        // 用正态分布模拟，让大多数人在40-70分之间
        if (totalScore >= 90) return Math.floor(95 + Math.random() * 4);
        if (totalScore >= 80) return Math.floor(85 + Math.random() * 10);
        if (totalScore >= 70) return Math.floor(70 + Math.random() * 15);
        if (totalScore >= 60) return Math.floor(50 + Math.random() * 20);
        if (totalScore >= 50) return Math.floor(30 + Math.random() * 20);
        if (totalScore >= 40) return Math.floor(15 + Math.random() * 15);
        return Math.floor(5 + Math.random() * 10);
    }

    // 获取维度等级
    getDimensionLevel(score) {
        if (score >= 22) return 'high';
        if (score >= 14) return 'medium';
        return 'low';
    }

    // 获取前N个最强维度
    getTopDimensions(scores, n = 2) {
        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([key]) => key);
    }

    // 获取最弱维度
    getWeakDimensions(scores, n = 2) {
        return Object.entries(scores)
            .sort((a, b) => a[1] - b[1])
            .slice(0, n)
            .map(([key]) => key);
    }

    // 渲染仪表盘
    renderGauge(containerId, totalScore) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.gaugeChart) this.gaugeChart.dispose();
        this.gaugeChart = echarts.init(container);

        const scoreColor = totalScore >= 70 ? '#ffd700' : totalScore >= 40 ? '#8b5cf6' : '#6b6b8a';

        const option = {
            series: [{
                type: 'gauge',
                startAngle: 200,
                endAngle: -20,
                min: 0,
                max: 100,
                splitNumber: 10,
                itemStyle: {
                    color: scoreColor
                },
                progress: {
                    show: true,
                    width: 16,
                    roundCap: true
                },
                pointer: { show: false },
                axisLine: {
                    lineStyle: {
                        width: 16,
                        color: [[1, 'rgba(255,255,255,0.05)']]
                    },
                    roundCap: true
                },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                title: { show: false },
                detail: {
                    fontSize: 48,
                    fontWeight: 900,
                    fontFamily: 'Noto Sans SC',
                    color: scoreColor,
                    offsetCenter: [0, '10%'],
                    formatter: '{value}',
                    valueAnimation: true
                },
                data: [{ value: totalScore }]
            }]
        };

        this.gaugeChart.setOption(option);
    }

    // 渲染雷达图
    renderRadar(containerId, scores) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.radarChart) this.radarChart.dispose();
        this.radarChart = echarts.init(container);

        const dimKeys = Object.keys(DIMENSIONS);
        const indicator = dimKeys.map(key => ({
            name: DIMENSIONS[key].emoji + ' ' + DIMENSIONS[key].name,
            max: 30
        }));

        const values = dimKeys.map(key => scores[key]);

        const option = {
            radar: {
                indicator: indicator,
                shape: 'polygon',
                radius: '65%',
                center: ['50%', '52%'],
                axisName: {
                    color: '#b0b0c8',
                    fontSize: 13,
                    fontFamily: 'Noto Sans SC'
                },
                axisLine: {
                    lineStyle: { color: 'rgba(255,255,255,0.08)' }
                },
                splitLine: {
                    lineStyle: { color: 'rgba(255,255,255,0.06)' }
                },
                splitArea: {
                    areaStyle: {
                        color: ['rgba(139,92,246,0.02)', 'rgba(139,92,246,0.04)']
                    }
                }
            },
            series: [{
                type: 'radar',
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: {
                    width: 2,
                    color: '#8b5cf6'
                },
                itemStyle: {
                    color: '#8b5cf6',
                    borderColor: '#fff',
                    borderWidth: 1
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(139, 92, 246, 0.35)' },
                        { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
                    ])
                },
                data: [{ value: values }],
                animationDuration: 1500,
                animationEasing: 'cubicOut'
            }]
        };

        this.radarChart.setOption(option);
    }

    // 渲染维度详细列表
    renderDimensions(containerId, scores) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const dimKeys = Object.keys(DIMENSIONS);
        let html = '';

        dimKeys.forEach((key, index) => {
            const dim = DIMENSIONS[key];
            const score = scores[key];
            const percent = Math.round((score / 30) * 100);
            const level = this.getDimensionLevel(score);
            const analysis = DIMENSION_ANALYSIS[key][level];

            html += `
        <div class="dimension-item" style="animation-delay: ${index * 0.1}s">
          <div class="dim-header">
            <div class="dim-name">
              <span class="dim-emoji">${dim.emoji}</span>
              <span>${dim.name}</span>
            </div>
            <div class="dim-score-display">${score}</div>
          </div>
          <div class="dim-progress-bar">
            <div class="dim-progress-fill ${dim.key}" id="dimBar_${key}" data-width="${percent}"></div>
          </div>
          <div class="dim-percent">${percent}%</div>
          <div class="dim-analysis">${analysis}</div>
        </div>
      `;
        });

        container.innerHTML = html;

        // 延迟后启动进度条动画
        setTimeout(() => {
            dimKeys.forEach(key => {
                const bar = document.getElementById(`dimBar_${key}`);
                if (bar) {
                    bar.style.width = bar.dataset.width + '%';
                }
            });
        }, 300);
    }

    // 渲染优势
    renderAdvantages(containerId, scores) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const topDims = this.getTopDimensions(scores, 3);
        let html = '';
        let num = 1;

        topDims.forEach(dimKey => {
            const advantages = ADVANTAGES_MAP[dimKey];
            if (advantages && advantages[0]) {
                html += `
          <div class="advantage-item">
            <div class="advantage-number">${num}</div>
            <div class="advantage-content">
              <h4>${advantages[0].title}</h4>
              <p>${advantages[0].desc}</p>
            </div>
          </div>
        `;
                num++;
            }
        });

        container.innerHTML = html;
    }

    // 渲染建议
    renderSuggestions(containerId, scores) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const weakDims = this.getWeakDimensions(scores, 2);
        const topDim = this.getTopDimensions(scores, 1)[0];

        let html = '';
        const suggestions = [];
        const seenTitles = new Set();

        // 弱项建议
        weakDims.forEach(key => {
            const level = this.getDimensionLevel(scores[key]);
            const sug = SUGGESTIONS_MAP[key][level === 'high' ? 'high' : 'low'];
            if (sug && !seenTitles.has(sug.title)) {
                suggestions.push(sug);
                seenTitles.add(sug.title);
            }
        });

        // 强项建议（去重）
        const topSug = SUGGESTIONS_MAP[topDim]?.high;
        if (topSug && !seenTitles.has(topSug.title)) {
            suggestions.push(topSug);
            seenTitles.add(topSug.title);
        }

        // 不够3条时从其他维度补充
        if (suggestions.length < 3) {
            for (const key of Object.keys(SUGGESTIONS_MAP)) {
                if (suggestions.length >= 3) break;
                const level = this.getDimensionLevel(scores[key]);
                const sug = SUGGESTIONS_MAP[key][level === 'high' ? 'high' : 'low'];
                if (sug && !seenTitles.has(sug.title)) {
                    suggestions.push(sug);
                    seenTitles.add(sug.title);
                }
            }
        }

        suggestions.forEach(sug => {
            html += `
        <div class="suggestion-item">
          <div class="suggestion-icon">${sug.icon}</div>
          <div class="suggestion-content">
            <h4>${sug.title}</h4>
            <p>${sug.desc}</p>
          </div>
        </div>
      `;
        });

        container.innerHTML = html;
    }

    // 生成完整报告
    generateReport(answers) {
        const scores = this.calculateScores(answers);
        const totalScore = this.calculateTotalScore(scores);
        const beatPercent = this.calculateBeatPercent(totalScore);
        const personality = this.matchPersonality(scores);

        // 更新日期
        const dateEl = document.getElementById('reportDate');
        if (dateEl) {
            const now = new Date();
            dateEl.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 测评报告`;
        }

        // 更新总分
        const scoreEl = document.getElementById('totalScore');
        if (scoreEl) scoreEl.textContent = totalScore;

        // 更新击败百分比
        const beatEl = document.getElementById('scoreBeat');
        if (beatEl) beatEl.textContent = `击败了 ${beatPercent}% 的测试者`;

        // 更新人格类型
        const typeIconEl = document.getElementById('typeIcon');
        const typeNameEl = document.getElementById('typeName');
        const typeTagEl = document.getElementById('typeTag');
        const typeDescEl = document.getElementById('typeDesc');
        if (typeIconEl) typeIconEl.textContent = personality.icon;
        if (typeNameEl) typeNameEl.textContent = '你的搞钱人格';
        if (typeTagEl) typeTagEl.textContent = personality.name;
        if (typeDescEl) typeDescEl.textContent = personality.description;

        // 渲染图表
        this.renderGauge('scoreGauge', totalScore);
        this.renderRadar('radarChart', scores);
        this.renderDimensions('dimensionsList', scores);
        this.renderAdvantages('advantagesList', scores);
        this.renderSuggestions('suggestionsList', scores);

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (this.gaugeChart) this.gaugeChart.resize();
            if (this.radarChart) this.radarChart.resize();
        });

        return { scores, totalScore, beatPercent, personality };
    }
}
