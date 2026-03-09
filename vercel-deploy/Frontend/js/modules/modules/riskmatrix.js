/**
 * Risk Matrix Component - Compact & Professional
 * مصفوفة تقييم المخاطر - مدمجة واحترافية
 */
const RiskMatrix = {
    getCurrentLanguage() {
        try {
            return localStorage.getItem('language') || (typeof AppState !== 'undefined' && AppState.currentLanguage) || 'ar';
        } catch (e) {
            return 'ar';
        }
    },

    getTranslations() {
        const lang = this.getCurrentLanguage();
        const translations = {
            ar: {
                'header.likelihood': 'الاحتمالية',
                'level.low': 'منخفض',
                'level.medium': 'متوسط',
                'level.high': 'عالي',
                'level.critical': 'حرج',
                'legend.low': 'منخفض (1-4)',
                'legend.medium': 'متوسط (5-9)',
                'legend.high': 'عالي (10-14)',
                'legend.critical': 'حرج (15-25)',
                'notify.selected': 'تم تحديد مستوى الخطر: {level} ({score})',
                'ptw.title': '📊 تقييم المخاطر المحدد:',
                'ptw.likelihood': 'الاحتمالية',
                'ptw.consequence': 'العواقب',
                'ptw.score': 'النتيجة',
                'ptw.level': 'مستوى الخطر',
                'ptw.extraNotes': 'ملاحظات إضافية:',
                'inv.title': '📊 نتائج تقييم المخاطر للحادث:',
                'inv.likelihood': 'الاحتمالية (Likelihood)',
                'inv.consequence': 'الشدة/العواقب (Consequence)',
                'inv.totalScore': 'الدرجة الكلية للمخاطر',
                'inv.level': 'مستوى الخطر المحدد',
                'inv.interpretation': 'التفسير والتوصيات:',
                'inv.notes': 'ملاحظات إضافية من المحقق:',
                'exp.low': 'هذا الحادث يُصنف ضمن المخاطر المنخفضة ({score} نقاط)، حيث أن احتمالية حدوثه {likelihood} والعواقب المحتملة {consequence}. يُنصح بمراقبة الوضع واتخاذ إجراءات وقائية بسيطة لتجنب تكرار الحادث.',
                'exp.medium': 'هذا الحادث يُصنف ضمن المخاطر المتوسطة ({score} نقاط)، مما يعني أن احتمالية حدوثه {likelihood} والعواقب المحتملة {consequence}. يتطلب الأمر اتخاذ إجراءات تصحيحية واضحة ومتابعة دورية لضمان عدم تكرار الحادث أو تطوره إلى خطر أعلى.',
                'exp.high': 'هذا الحادث يُصنف ضمن المخاطر العالية ({score} نقاط)، حيث أن احتمالية حدوثه {likelihood} والعواقب المحتملة {consequence}. يتطلب اتخاذ إجراءات عاجلة وشاملة، مع ضرورة تخصيص موارد كافية ومتابعة مكثفة من الإدارة العليا لمنع تكرار الحادث.',
                'exp.critical': 'هذا الحادث يُصنف ضمن المخاطر الحرجة ({score} نقاط)، وهو أعلى مستوى خطورة! احتمالية حدوثه {likelihood} والعواقب {consequence}. يتطلب تدخلاً فورياً وإيقاف أي أنشطة مشابهة حتى يتم معالجة جميع الأسباب الجذرية. يجب رفع التقرير للإدارة العليا فوراً مع خطة عمل شاملة.',
                'exp.default': 'يرجى مراجعة تقييم المخاطر واتخاذ الإجراءات المناسبة.'
            },
            en: {
                'header.likelihood': 'Likelihood',
                'level.low': 'Low',
                'level.medium': 'Medium',
                'level.high': 'High',
                'level.critical': 'Critical',
                'legend.low': 'Low (1-4)',
                'legend.medium': 'Medium (5-9)',
                'legend.high': 'High (10-14)',
                'legend.critical': 'Critical (15-25)',
                'notify.selected': 'Risk level selected: {level} ({score})',
                'ptw.title': '📊 Selected Risk Assessment:',
                'ptw.likelihood': 'Likelihood',
                'ptw.consequence': 'Consequence',
                'ptw.score': 'Score',
                'ptw.level': 'Risk Level',
                'ptw.extraNotes': 'Additional notes:',
                'inv.title': '📊 Incident Risk Assessment Results:',
                'inv.likelihood': 'Likelihood',
                'inv.consequence': 'Consequence',
                'inv.totalScore': 'Total Risk Score',
                'inv.level': 'Selected Risk Level',
                'inv.interpretation': 'Interpretation & recommendations:',
                'inv.notes': 'Additional investigator notes:',
                'exp.low': 'This incident is classified as low risk ({score} points). Likelihood is {likelihood} and expected consequence is {consequence}. Monitor the situation and apply simple preventive controls to avoid recurrence.',
                'exp.medium': 'This incident is classified as medium risk ({score} points). Likelihood is {likelihood} and expected consequence is {consequence}. Clear corrective actions and periodic follow-up are required to prevent recurrence or escalation.',
                'exp.high': 'This incident is classified as high risk ({score} points). Likelihood is {likelihood} and expected consequence is {consequence}. Immediate and comprehensive actions are required with strong management follow-up.',
                'exp.critical': 'This incident is classified as critical risk ({score} points), the highest severity level. Likelihood is {likelihood} and consequence is {consequence}. Immediate intervention is required and similar activities should be stopped until root causes are addressed.',
                'exp.default': 'Please review the risk assessment and apply appropriate actions.'
            }
        };

        return {
            lang,
            t: (key) => (translations[lang] && translations[lang][key]) ? translations[lang][key] : key
        };
    },

    /**
     * توليد مصفوفة تقييم المخاطر
     */
    generate(containerId, options = {}) {
        const { t, lang } = this.getTranslations();
        const {
            selectedLikelihood = null,
            selectedConsequence = null,
            interactive = true
        } = options;

        // مستويات مدمجة
        const likelihood = [
            { value: 5, ar: 'شبه مؤكد', en: 'Almost Certain' },
            { value: 4, ar: 'محتمل جداً', en: 'Very Likely' },
            { value: 3, ar: 'محتمل', en: 'Likely' },
            { value: 2, ar: 'غير محتمل', en: 'Unlikely' },
            { value: 1, ar: 'نادر', en: 'Rare' }
        ];

        const consequence = [
            { value: 1, ar: 'ضئيلة', en: 'Negligible' },
            { value: 2, ar: 'بسيطة', en: 'Minor' },
            { value: 3, ar: 'متوسطة', en: 'Moderate' },
            { value: 4, ar: 'كبيرة', en: 'Major' },
            { value: 5, ar: 'كارثية', en: 'Catastrophic' }
        ];

        // حساب مستوى الخطر
        const getRiskLevel = (l, c) => {
            const score = l * c;
            if (score >= 15) return { level: 'critical', label: t('level.critical'), color: '#fff', bg: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', border: '#991b1b' };
            if (score >= 10) return { level: 'high', label: t('level.high'), color: '#fff', bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', border: '#ea580c' };
            if (score >= 5) return { level: 'medium', label: t('level.medium'), color: '#000', bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', border: '#f59e0b' };
            return { level: 'low', label: t('level.low'), color: '#fff', bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: '#059669' };
        };

        // HTML مدمج واحترافي
        return `
            <style>
                .risk-matrix-compact {
                    max-width: 450px;
                    margin: 0 auto;
                    font-family: 'Cairo', 'Segoe UI', sans-serif;
                }
                .risk-matrix-compact table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 3px;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    padding: 8px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                .risk-matrix-compact th {
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    color: white;
                    padding: 6px 3px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-align: center;
                    border-radius: 6px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .risk-matrix-compact th.corner {
                    width: 70px;
                    font-size: 0.65rem;
                }
                .risk-matrix-compact td.label {
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    color: white;
                    padding: 6px 3px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-align: center;
                    border-radius: 6px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .risk-matrix-compact .risk-cell {
                    padding: 8px 4px;
                    text-align: center;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .risk-matrix-compact .risk-cell:hover {
                    transform: scale(1.12) translateY(-2px);
                    z-index: 10;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
                }
                .risk-matrix-compact .risk-cell.selected {
                    transform: scale(1.15) translateY(-3px);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5), 0 8px 20px rgba(0,0,0,0.25);
                    z-index: 20;
                }
                .risk-matrix-compact .risk-cell .score {
                    font-size: 1.2rem;
                    font-weight: 900;
                    line-height: 1;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }
                .risk-matrix-compact .risk-cell .level {
                    font-size: 0.6rem;
                    font-weight: 700;
                    margin-top: 2px;
                    opacity: 0.95;
                }
                .risk-legend {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 6px;
                    margin-top: 12px;
                    font-size: 0.7rem;
                }
                .risk-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 8px;
                    background: white;
                    border-radius: 6px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .risk-legend-color {
                    width: 18px;
                    height: 18px;
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
            </style>
            
            <div class="risk-matrix-compact">
                <table>
                    <thead>
                        <tr>
                            <th class="corner">
                                <div style="font-size: 0.65rem;">${t('header.likelihood')}</div>
                                <div style="font-size: 0.55rem; opacity: 0.8;">↓</div>
                            </th>
                            ${consequence.map(c => `
                                <th>
                                    <div>${lang === 'en' ? c.en : c.ar}</div>
                                    <div style="font-size: 0.85rem; margin-top: 1px;">${c.value}</div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${likelihood.map(l => `
                            <tr>
                                <td class="label">
                                    <div>${lang === 'en' ? l.en : l.ar}</div>
                                    <div style="font-size: 0.85rem; margin-top: 1px;">${l.value}</div>
                                </td>
                                ${consequence.map(c => {
            const risk = getRiskLevel(l.value, c.value);
            const score = l.value * c.value;
            const isSelected = selectedLikelihood === l.value && selectedConsequence === c.value;

            return `
                                        <td class="risk-cell ${isSelected ? 'selected' : ''}"
                                            data-likelihood="${l.value}"
                                            data-likelihood-label="${lang === 'en' ? l.en : l.ar}"
                                            data-consequence="${c.value}"
                                            data-consequence-label="${lang === 'en' ? c.en : c.ar}"
                                            data-score="${score}"
                                            data-level="${risk.level}"
                                            data-level-label="${risk.label}"
                                            style="background: ${risk.bg}; color: ${risk.color};"
                                            onclick="RiskMatrix.selectCell(this, '${containerId}')">
                                            <div class="score">${score}</div>
                                            <div class="level">${risk.label}</div>
                                        </td>
                                    `;
        }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="risk-legend">
                    <div class="risk-legend-item">
                        <div class="risk-legend-color" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);"></div>
                        <span style="color: #059669; font-weight: 700;">${t('legend.low')}</span>
                    </div>
                    <div class="risk-legend-item">
                        <div class="risk-legend-color" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);"></div>
                        <span style="color: #d97706; font-weight: 700;">${t('legend.medium')}</span>
                    </div>
                    <div class="risk-legend-item">
                        <div class="risk-legend-color" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);"></div>
                        <span style="color: #ea580c; font-weight: 700;">${t('legend.high')}</span>
                    </div>
                    <div class="risk-legend-item">
                        <div class="risk-legend-color" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);"></div>
                        <span style="color: #dc2626; font-weight: 700;">${t('legend.critical')}</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * معالجة اختيار خلية - مع تحديث تلقائي للملاحظات
     */
    selectCell(cell, containerId) {
        const { t } = this.getTranslations();
        const container = document.getElementById(containerId);
        if (!container) return;

        // إزالة التحديد السابق
        container.querySelectorAll('.risk-cell').forEach(c => {
            c.classList.remove('selected');
        });

        // تحديد الخلية الحالية
        cell.classList.add('selected');

        // استخراج البيانات
        const likelihood = parseInt(cell.getAttribute('data-likelihood'));
        const likelihoodLabel = cell.getAttribute('data-likelihood-label');
        const consequence = parseInt(cell.getAttribute('data-consequence'));
        const consequenceLabel = cell.getAttribute('data-consequence-label');
        const score = parseInt(cell.getAttribute('data-score'));
        const level = cell.getAttribute('data-level');
        const levelLabel = cell.getAttribute('data-level-label');

        // التعرف على نوع النموذج (PTW أو Investigation)
        const isInvestigationForm = containerId === 'investigation-risk-matrix';
        const isPTWForm = containerId === 'ptw-risk-matrix';

        if (isPTWForm) {
            // معالجة نموذج تصريح العمل (PTW)
            const likelihoodInput = document.getElementById('ptw-risk-likelihood');
            const consequenceInput = document.getElementById('ptw-risk-consequence');

            if (likelihoodInput) likelihoodInput.value = likelihood;
            if (consequenceInput) consequenceInput.value = consequence;

            // تحديث حقل الملاحظات تلقائياً
            const notesTextarea = document.getElementById('ptw-risk-notes');
            if (notesTextarea) {
                const riskInfo = `${t('ptw.title')}
━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${t('ptw.likelihood')}: ${likelihoodLabel} (${likelihood})
• ${t('ptw.consequence')}: ${consequenceLabel} (${consequence})
• ${t('ptw.score')}: ${score}
• ${t('ptw.level')}: ${levelLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━

${t('ptw.extraNotes')}
`;

                // إذا كان الحقل فارغاً أو يحتوي على تقييم سابق، استبدله
                const currentValue = notesTextarea.value.trim();
                if (!currentValue || currentValue.startsWith('📊 تقييم المخاطر المحدد:')) {
                    notesTextarea.value = riskInfo;
                } else {
                    // إضافة التقييم في البداية
                    notesTextarea.value = riskInfo + '\n' + currentValue;
                }

                // تمييز الحقل مؤقتاً
                notesTextarea.style.background = '#fef3c7';
                notesTextarea.style.borderColor = '#f59e0b';
                setTimeout(() => {
                    notesTextarea.style.background = '';
                    notesTextarea.style.borderColor = '';
                }, 1000);
            }
        } else if (isInvestigationForm) {
            // معالجة نموذج التحقيق في الحادث (Investigation)
            
            // تحديث الحقول المخفية
            const probabilityInput = document.getElementById('investigation-risk-probability');
            const severityInput = document.getElementById('investigation-risk-severity');
            const levelInput = document.getElementById('investigation-risk-level');

            if (probabilityInput) probabilityInput.value = likelihood;
            if (severityInput) severityInput.value = consequence;
            if (levelInput) levelInput.value = score;

            // تحديث حقل "نتيجة التقييم" تلقائياً
            const resultInput = document.getElementById('investigation-risk-result');
            if (resultInput) {
                // تحديد القيمة بناءً على مستوى الخطر
                let resultValue = levelLabel; // استخدام النص العربي مباشرة
                
                // تأثير بصري للتحديث
                resultInput.value = resultValue;
                resultInput.style.background = this.getRiskBackgroundColor(level);
                resultInput.style.color = (level === 'low' || level === 'medium') ? '#000' : '#fff';
                resultInput.style.fontWeight = '700';
                resultInput.style.textAlign = 'center';
                
                // تمييز الحقل مؤقتاً
                setTimeout(() => {
                    resultInput.style.background = '#f0fdfa';
                    resultInput.style.color = '#000';
                }, 2000);
            }

            // تحديث حقل "شرح الخطر" تلقائياً
            const explanationTextarea = document.getElementById('investigation-risk-explanation');
            if (explanationTextarea) {
                const riskExplanation = `${t('inv.title')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${t('inv.likelihood')}: ${likelihoodLabel} - ${likelihood}/5
• ${t('inv.consequence')}: ${consequenceLabel} - ${consequence}/5
• ${t('inv.totalScore')}: ${score}
• ${t('inv.level')}: ${levelLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${t('inv.interpretation')}
${this.getRiskExplanationText(score, level, likelihoodLabel, consequenceLabel)}

${t('inv.notes')}
`;

                // إذا كان الحقل فارغاً أو يحتوي على تقييم سابق، استبدله
                const currentValue = explanationTextarea.value.trim();
                if (!currentValue || currentValue.startsWith('📊 نتائج تقييم المخاطر')) {
                    explanationTextarea.value = riskExplanation;
                } else {
                    // الاحتفاظ بالملاحظات الإضافية
                    explanationTextarea.value = riskExplanation;
                }

                // تمييز الحقل مؤقتاً
                explanationTextarea.style.background = '#ecfdf5';
                explanationTextarea.style.borderColor = '#10b981';
                explanationTextarea.style.borderWidth = '2px';
                setTimeout(() => {
                    explanationTextarea.style.background = '#f0fdfa';
                    explanationTextarea.style.borderColor = '#14b8a6';
                    explanationTextarea.style.borderWidth = '1px';
                }, 2000);
            }
        }

        // إطلاق حدث مخصص
        const event = new CustomEvent('riskMatrixSelect', {
            detail: {
                likelihood,
                likelihoodLabel,
                consequence,
                consequenceLabel,
                score,
                level,
                levelLabel,
                containerId
            },
            bubbles: true
        });
        container.dispatchEvent(event);

        // إشعار بصري
        if (typeof Notification !== 'undefined' && Notification.success) {
            Notification.success(t('notify.selected').replace('{level}', levelLabel).replace('{score}', score));
        }

        // Log للتطوير
        if (typeof Utils !== 'undefined' && Utils.safeLog) {
            Utils.safeLog('✅ Risk Matrix Selection:', {
                container: containerId,
                likelihood: `${likelihoodLabel} (${likelihood})`,
                consequence: `${consequenceLabel} (${consequence})`,
                score,
                level: `${levelLabel} (${level})`
            });
        }
    },

    /**
     * الحصول على لون الخلفية بناءً على مستوى الخطر
     */
    getRiskBackgroundColor(level) {
        const colors = {
            'low': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            'medium': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            'high': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            'critical': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
        };
        return colors[level] || colors['low'];
    },

    /**
     * الحصول على نص الشرح بناءً على مستوى الخطر
     */
    getRiskExplanationText(score, level, likelihoodLabel, consequenceLabel) {
        const { t } = this.getTranslations();
        const explanationByLevel = {
            low: t('exp.low'),
            medium: t('exp.medium'),
            high: t('exp.high'),
            critical: t('exp.critical')
        };

        return (explanationByLevel[level] || t('exp.default'))
            .replace('{score}', score)
            .replace('{likelihood}', likelihoodLabel)
            .replace('{consequence}', consequenceLabel);
    }
};

// ===== Export module to global scope =====
// تصدير الموديول إلى window فوراً لضمان توافره
(function () {
    'use strict';
    try {
        if (typeof window !== 'undefined' && typeof RiskMatrix !== 'undefined') {
            window.RiskMatrix = RiskMatrix;
            
            // إشعار عند تحميل الموديول بنجاح
            if (typeof AppState !== 'undefined' && AppState.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ RiskMatrix module loaded and available on window.RiskMatrix');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تصدير RiskMatrix:', error);
        // محاولة التصدير مرة أخرى حتى في حالة الخطأ
        if (typeof window !== 'undefined' && typeof RiskMatrix !== 'undefined') {
            try {
                window.RiskMatrix = RiskMatrix;
            } catch (e) {
                console.error('❌ فشل تصدير RiskMatrix:', e);
            }
        }
    }
})();
