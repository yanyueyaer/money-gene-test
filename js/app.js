// 搞钱基因测试 — 主应用逻辑
import { QUESTIONS, OPTIONS, DIMENSIONS } from './questions.js';
import { ReportGenerator } from './report.js';
import { TokenManager } from './codeManager.js';

class App {
    constructor() {
        this.currentPage = 'codegate';
        this.currentQuestion = 0;
        this.answers = [];
        this.reportGenerator = new ReportGenerator();

        // 自动检测URL中的token并验证
        this.initTokenValidation();
    }

    // 自动验证URL token
    async initTokenValidation() {
        const token = TokenManager.getTokenFromURL();

        if (!token) {
            // 没有token参数，显示错误页
            document.getElementById('gateMessage').textContent = '请通过购买获取的专属链接访问';
            return;
        }

        // 验证token
        const result = await TokenManager.validateToken(token);

        if (result.valid) {
            // 验证通过，直接进入测试介绍页
            this.showPage('intro');
        } else {
            // 验证失败，显示对应错误
            const message = TokenManager.getErrorMessage(result.reason);
            document.getElementById('gateMessage').textContent = message;
        }
    }

    // 页面切换
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('active');
            window.scrollTo(0, 0);
        }
        this.currentPage = pageId;
    }

    // 开始测试
    startQuiz() {
        this.currentQuestion = 0;
        this.answers = [];
        this.showPage('quiz');
        this.renderQuestion();
    }

    // 渲染当前题目
    renderQuestion() {
        const q = QUESTIONS[this.currentQuestion];
        if (!q) return;

        const dim = DIMENSIONS[q.dimension];

        // 更新进度信息
        document.getElementById('currentNum').textContent = this.currentQuestion + 1;
        document.getElementById('totalNum').textContent = QUESTIONS.length;
        document.getElementById('dimensionBadge').textContent = dim.name;

        // 更新进度条
        const progress = ((this.currentQuestion) / QUESTIONS.length) * 100;
        document.getElementById('progressBar').style.width = progress + '%';

        // 更新返回按钮状态
        const backBtn = document.getElementById('backBtn');
        if (this.currentQuestion === 0) {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }

        // 更新题目
        document.getElementById('questionText').textContent =
            `${this.currentQuestion + 1}. ${q.text}`;

        // 渲染选项
        const optionsList = document.getElementById('optionsList');

        // 先移除旧动画，添加新动画
        const questionArea = document.getElementById('questionArea');
        questionArea.style.animation = 'none';
        questionArea.offsetHeight; // 触发重排
        questionArea.style.animation = 'fadeInRight 0.3s ease-out';

        let optionsHtml = '';
        const existingAnswer = this.answers.find(
            a => a.questionIndex === this.currentQuestion
        );

        OPTIONS.forEach((opt, index) => {
            const isSelected = existingAnswer && existingAnswer.score === opt.score;
            optionsHtml += `
        <div class="option-item ${isSelected ? 'selected' : ''}"
             data-score="${opt.score}"
             data-index="${index}">
          <div class="option-radio"></div>
          <div class="option-text">${opt.text}</div>
        </div>
      `;
        });

        optionsList.innerHTML = optionsHtml;

        // 绑定点击事件
        optionsList.querySelectorAll('.option-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectOption(
                    parseInt(item.dataset.score),
                    parseInt(item.dataset.index)
                );
            });
        });
    }

    // 选择选项
    selectOption(score, optionIndex) {
        const q = QUESTIONS[this.currentQuestion];

        // 移除之前的选中状态
        document.querySelectorAll('.option-item').forEach(item => {
            item.classList.remove('selected');
        });

        // 选中当前选项
        const items = document.querySelectorAll('.option-item');
        items[optionIndex].classList.add('selected');

        // 保存答案（如果已有答案则更新）
        const existingIndex = this.answers.findIndex(
            a => a.questionIndex === this.currentQuestion
        );

        const answer = {
            questionIndex: this.currentQuestion,
            dimension: q.dimension,
            score: score
        };

        if (existingIndex >= 0) {
            this.answers[existingIndex] = answer;
        } else {
            this.answers.push(answer);
        }

        // 短暂延迟后自动进入下一题
        setTimeout(() => {
            this.nextQuestion();
        }, 350);
    }

    // 下一题
    nextQuestion() {
        if (this.currentQuestion < QUESTIONS.length - 1) {
            this.currentQuestion++;
            this.renderQuestion();
        } else {
            // 所有题目答完，进入加载页
            this.showLoading();
        }
    }

    // 上一题
    prevQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.renderQuestion();
        }
    }

    // 显示加载动画
    showLoading() {
        this.showPage('loading');

        const steps = ['step1', 'step2', 'step3', 'step4', 'step5'];
        const progressBar = document.getElementById('loadingProgressBar');
        const progressText = document.getElementById('loadingProgressText');

        // 重置所有步骤
        steps.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active', 'done');
                const icon = el.querySelector('.step-icon');
                if (icon) {
                    icon.textContent = '○';
                    icon.classList.remove('done');
                }
            }
        });
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = '0%';

        // 逐步动画
        let currentStep = 0;
        const stepDuration = 700;

        const runStep = () => {
            if (currentStep >= steps.length) {
                // 所有步骤完成，进入报告页
                setTimeout(() => {
                    this.showReport();
                }, 600);
                return;
            }

            const stepEl = document.getElementById(steps[currentStep]);
            if (stepEl) {
                stepEl.classList.add('active');

                setTimeout(() => {
                    stepEl.classList.remove('active');
                    stepEl.classList.add('done');
                    const icon = stepEl.querySelector('.step-icon');
                    if (icon) {
                        icon.textContent = '✓';
                        icon.classList.add('done');
                    }

                    // 更新进度条
                    const percent = Math.round(((currentStep + 1) / steps.length) * 100);
                    if (progressBar) progressBar.style.width = percent + '%';
                    if (progressText) progressText.textContent = percent + '%';

                    currentStep++;
                    runStep();
                }, stepDuration);
            }
        };

        // 延迟一小段时间后启动
        setTimeout(runStep, 400);
    }

    // 显示报告
    showReport() {
        this.showPage('report');

        // 生成报告
        setTimeout(() => {
            this.reportGenerator.generateReport(this.answers);
        }, 200);
    }

    // 重新测试
    restart() {
        this.currentQuestion = 0;
        this.answers = [];
        this.showPage('intro');
    }
}

// 初始化应用
const app = new App();
window.app = app;
