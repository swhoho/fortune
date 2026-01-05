/**
 * AnalysisPipeline v2.1
 * 멀티스텝 사주 분석 파이프라인 오케스트레이션
 *
 * v2.1 변경사항:
 * - 클래스 분해: PipelineContext, StepExecutor 분리
 * - 타입 중앙화: pipeline/types.ts
 * - 오케스트레이션 전용 클래스로 단순화
 */

import { getGeminiModel } from '../gemini';
import type {
  GeminiAnalysisInput,
  SajuAnalysisResult,
  BasicAnalysisResult,
  PersonalityResult,
  AptitudeResult,
  FortuneResult,
  JijangganData,
  StepPromptResponse,
} from '../types';
import { extractTenGods } from '../../score/ten-gods';
import type { TenGodCounts } from '../../score/types';
import type {
  PipelineStep,
  PipelineOptions,
  PipelineResponse,
  PipelineIntermediateResults,
  SupportedLanguage,
  GeminiApiError,
} from './types';
import { PIPELINE_STEPS } from './types';
import { PipelineContext } from './context';
import { StepExecutor } from './step-executor';

/**
 * AnalysisPipeline 클래스
 * v2.1: 오케스트레이션 전용 (단계 실행/상태 관리 분리)
 */
export class AnalysisPipeline {
  private context: PipelineContext;
  private executor: StepExecutor;

  constructor(options?: PipelineOptions) {
    this.context = new PipelineContext(options);
    this.executor = new StepExecutor(this.context);
  }

  /**
   * 이전 결과로 상태 복원 (재시도용)
   */
  hydrate(results: PipelineIntermediateResults, fromStep: PipelineStep): void {
    this.context.hydrate(results, fromStep);
  }

  /**
   * 메인 파이프라인 실행
   */
  async execute(input: GeminiAnalysisInput): Promise<PipelineResponse> {
    this.context.start();

    try {
      // 1. 만세력 계산
      await this.executor.execute('manseryeok', () => this.fetchManseryeok(input));

      // 2. 지장간 추출
      await this.executor.execute('jijanggan', () => this.extractJijanggan());

      // 3. 기본 분석
      await this.executor.execute('basic_analysis', () =>
        this.analyzeBasic(input.language || 'ko')
      );

      // 4-6. 병렬 또는 순차 실행
      if (this.context.enableParallel) {
        await this.executeParallelSteps(input.language || 'ko');
      } else {
        await this.executeSequentialSteps(input.language || 'ko');
      }

      // 7. 점수 계산
      await this.executor.execute('scoring', () => this.calculateScores());

      // 8. 시각화 생성
      await this.executor.execute('visualization', () => this.generateVisualization());

      // 9. 결과 통합
      await this.executor.execute('saving', () => this.prepareFinalResult());

      // 10. 완료
      this.context.updateStepStatus('complete', 'completed');

      return {
        success: true,
        data: {
          finalResult: this.buildFinalResult(),
          intermediateResults: this.context.intermediateResults,
          pipelineMetadata: {
            totalDuration: this.context.getTotalDuration(),
            stepDurations: this.context.stepDurations,
            parallelExecuted: this.context.enableParallel,
            version: '2.1.0',
            tokenUsage: this.context.getTokenUsage(),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
        partialResults: this.context.intermediateResults,
        failedStep: this.context.getCurrentFailedStep(),
        // 실패해도 사용한 토큰은 기록
        tokenUsage: this.context.getTokenUsage(),
      };
    }
  }

  /**
   * 특정 단계부터 재실행
   */
  async executeFromStep(
    input: GeminiAnalysisInput,
    fromStep: PipelineStep
  ): Promise<PipelineResponse> {
    this.context.startedAt = new Date();
    const fromIndex = PIPELINE_STEPS.indexOf(fromStep);

    try {
      if (fromIndex <= PIPELINE_STEPS.indexOf('manseryeok')) {
        await this.executor.execute('manseryeok', () => this.fetchManseryeok(input));
      }
      if (fromIndex <= PIPELINE_STEPS.indexOf('jijanggan')) {
        await this.executor.execute('jijanggan', () => this.extractJijanggan());
      }
      if (fromIndex <= PIPELINE_STEPS.indexOf('basic_analysis')) {
        await this.executor.execute('basic_analysis', () =>
          this.analyzeBasic(input.language || 'ko')
        );
      }

      const parallelIndex = PIPELINE_STEPS.indexOf('personality');
      if (fromIndex <= parallelIndex) {
        if (this.context.enableParallel) {
          await this.executeParallelSteps(input.language || 'ko');
        } else {
          await this.executeSequentialSteps(input.language || 'ko');
        }
      }

      if (fromIndex <= PIPELINE_STEPS.indexOf('scoring')) {
        await this.executor.execute('scoring', () => this.calculateScores());
      }
      if (fromIndex <= PIPELINE_STEPS.indexOf('visualization')) {
        await this.executor.execute('visualization', () => this.generateVisualization());
      }
      if (fromIndex <= PIPELINE_STEPS.indexOf('saving')) {
        await this.executor.execute('saving', () => this.prepareFinalResult());
      }

      this.context.updateStepStatus('complete', 'completed');

      return {
        success: true,
        data: {
          finalResult: this.buildFinalResult(),
          intermediateResults: this.context.intermediateResults,
          pipelineMetadata: {
            totalDuration: this.context.getTotalDuration(),
            stepDurations: this.context.stepDurations,
            parallelExecuted: this.context.enableParallel,
            version: '2.1.0',
            tokenUsage: this.context.getTokenUsage(),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
        partialResults: this.context.intermediateResults,
        failedStep: this.context.getCurrentFailedStep(),
        // 실패해도 사용한 토큰은 기록
        tokenUsage: this.context.getTokenUsage(),
      };
    }
  }

  // ============================================
  // 병렬/순차 실행
  // ============================================

  private async executeParallelSteps(language: SupportedLanguage): Promise<void> {
    const parallelStart = Date.now();

    const results = await Promise.allSettled([
      this.executor.execute('personality', () => this.analyzePersonality(language)),
      this.executor.execute('aptitude', () => this.analyzeAptitude(language)),
      this.executor.execute('fortune', () => this.analyzeFortune(language)),
    ]);

    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed.length > 0 && failed[0]) {
      throw failed[0].reason;
    }

    console.log(`[AnalysisPipeline] 병렬 단계 완료: ${Date.now() - parallelStart}ms`);
  }

  private async executeSequentialSteps(language: SupportedLanguage): Promise<void> {
    await this.executor.execute('personality', () => this.analyzePersonality(language));
    await this.executor.execute('aptitude', () => this.analyzeAptitude(language));
    await this.executor.execute('fortune', () => this.analyzeFortune(language));
  }

  // ============================================
  // 개별 단계 구현
  // ============================================

  private async fetchManseryeok(input: GeminiAnalysisInput): Promise<void> {
    if (input.pillars) {
      this.context.intermediateResults.manseryeok = {
        pillars: input.pillars,
        daewun: input.daewun || [],
        jijanggan: { year: [], month: [], day: [], hour: [] },
      };
      return;
    }
    throw new Error('만세력 입력 데이터가 필요합니다');
  }

  private async extractJijanggan(): Promise<JijangganData> {
    const pillars = this.context.intermediateResults.manseryeok?.pillars;
    if (!pillars) {
      throw new Error('만세력 데이터가 없습니다');
    }

    const jijangganMap: Record<string, string[]> = {
      子: ['癸'],
      丑: ['癸', '辛', '己'],
      寅: ['戊', '丙', '甲'],
      卯: ['乙'],
      辰: ['乙', '癸', '戊'],
      巳: ['戊', '庚', '丙'],
      午: ['己', '丁'],
      未: ['丁', '乙', '己'],
      申: ['己', '壬', '庚'],
      酉: ['辛'],
      戌: ['辛', '丁', '戊'],
      亥: ['戊', '甲', '壬'],
    };

    const jijanggan: JijangganData = {
      year: jijangganMap[pillars.year.branch] || [],
      month: jijangganMap[pillars.month.branch] || [],
      day: jijangganMap[pillars.day.branch] || [],
      hour: jijangganMap[pillars.hour.branch] || [],
    };

    if (this.context.intermediateResults.manseryeok) {
      this.context.intermediateResults.manseryeok.jijanggan = jijanggan;
    }
    return jijanggan; // onStepComplete에 전달하기 위해 반환
  }

  private async analyzeBasic(language: SupportedLanguage): Promise<BasicAnalysisResult> {
    const prompt = await this.fetchStepPrompt('basic', language);
    const result = await this.callGemini<BasicAnalysisResult>(prompt);
    this.context.intermediateResults.basicAnalysis = result;
    return result; // onStepComplete에 전달하기 위해 반환
  }

  private async analyzePersonality(language: SupportedLanguage): Promise<PersonalityResult> {
    const prompt = await this.fetchStepPrompt('personality', language);
    const result = await this.callGemini<PersonalityResult>(prompt);
    this.context.intermediateResults.personality = result;
    return result; // onStepComplete에 전달하기 위해 반환
  }

  private async analyzeAptitude(language: SupportedLanguage): Promise<AptitudeResult> {
    const prompt = await this.fetchStepPrompt('aptitude', language);
    const result = await this.callGemini<AptitudeResult>(prompt);
    this.context.intermediateResults.aptitude = result;
    return result; // onStepComplete에 전달하기 위해 반환
  }

  private async analyzeFortune(language: SupportedLanguage): Promise<FortuneResult> {
    const prompt = await this.fetchStepPrompt('fortune', language);
    const result = await this.callGemini<FortuneResult>(prompt);
    this.context.intermediateResults.fortune = result;
    return result; // onStepComplete에 전달하기 위해 반환
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async calculateScores(): Promise<any> {
    const { manseryeok, personality } = this.context.intermediateResults;

    if (!manseryeok?.pillars || !manseryeok?.jijanggan) {
      throw new Error('만세력 데이터가 없습니다');
    }

    const { calculateAllScores } = await import('../../score');
    const calculatedScores = calculateAllScores(manseryeok.pillars, manseryeok.jijanggan);

    if (personality?.willpower?.score) {
      calculatedScores.personality.willpower = personality.willpower.score;
    }

    this.context.intermediateResults.scores = calculatedScores;
    return calculatedScores; // onStepComplete에 전달하기 위해 반환
  }

  private async generateVisualization(): Promise<{ pillarImage: string }> {
    const pillars = this.context.intermediateResults.manseryeok?.pillars;
    if (!pillars) {
      throw new Error('사주 데이터가 없습니다');
    }

    try {
      const response = await fetch(`${this.context.pythonApiUrl}/api/visualization/pillar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillars }),
      });

      if (!response.ok) {
        throw new Error('시각화 API 실패');
      }

      const data = await response.json();
      const visualization = { pillarImage: data.imageBase64 };
      this.context.intermediateResults.visualization = visualization;
      return visualization; // onStepComplete에 전달하기 위해 반환
    } catch (error) {
      console.warn('[AnalysisPipeline] 시각화 생성 실패, 스킵:', error);
      const visualization = { pillarImage: '' };
      this.context.intermediateResults.visualization = visualization;
      return visualization; // onStepComplete에 전달하기 위해 반환
    }
  }

  private async prepareFinalResult(): Promise<void> {
    // 최종 결과 준비 - 검증은 경고만 (데이터는 buildFinalResult에서 fallback 처리)
    if (!this.context.intermediateResults.basicAnalysis) {
      console.warn('[AnalysisPipeline] 경고: basicAnalysis가 없습니다. 기본값으로 대체됩니다.');
    }
  }

  // ============================================
  // 유틸리티
  // ============================================

  private async fetchStepPrompt(
    step: 'basic' | 'personality' | 'aptitude' | 'fortune',
    language: SupportedLanguage
  ): Promise<string> {
    const { manseryeok, basicAnalysis } = this.context.intermediateResults;

    // v3.0: 십신 분포 계산 (personality, aptitude, fortune 단계)
    let tenGodCounts: TenGodCounts | undefined;
    if (step !== 'basic' && manseryeok?.pillars && manseryeok?.jijanggan) {
      try {
        tenGodCounts = extractTenGods(manseryeok.pillars, manseryeok.jijanggan);
      } catch (e) {
        console.warn('[AnalysisPipeline] 십신 추출 실패:', e);
      }
    }

    try {
      const response = await fetch(`${this.context.pythonApiUrl}/api/prompts/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          language,
          pillars: manseryeok?.pillars,
          daewun: manseryeok?.daewun,
          jijanggan: manseryeok?.jijanggan,
          previousResults: step !== 'basic' ? { basicAnalysis } : undefined,
          // v3.0: 십신 분포 전달
          tenGodCounts: tenGodCounts,
        }),
      });

      if (!response.ok) {
        throw new Error(`프롬프트 API 실패: ${step}`);
      }

      const data: StepPromptResponse = await response.json();
      return `${data.systemPrompt}\n\n${data.userPrompt}`;
    } catch (error) {
      console.warn(`[AnalysisPipeline] ${step} 프롬프트 API 실패, 폴백 사용:`, error);
      return this.getFallbackPrompt(step);
    }
  }

  private getFallbackPrompt(step: 'basic' | 'personality' | 'aptitude' | 'fortune'): string {
    const pillars = this.context.intermediateResults.manseryeok?.pillars;
    if (!pillars) {
      throw new Error('사주 데이터가 없습니다');
    }

    const pillarsStr = `
연주: ${pillars.year.stem}${pillars.year.branch}
월주: ${pillars.month.stem}${pillars.month.branch}
일주: ${pillars.day.stem}${pillars.day.branch}
시주: ${pillars.hour.stem}${pillars.hour.branch}`;

    const prompts = {
      basic: `당신은 30년 경력의 명리학 거장입니다.\n아래 사주를 분석해주세요.\n${pillarsStr}\n\nJSON으로 응답해주세요.`,
      personality: `당신은 30년 경력의 명리학 거장입니다.\n아래 사주의 성격을 분석해주세요.\n${pillarsStr}\n\nJSON으로 응답해주세요.`,
      aptitude: `당신은 30년 경력의 명리학 거장입니다.\n아래 사주의 적성을 분석해주세요.\n${pillarsStr}\n\nJSON으로 응답해주세요.`,
      fortune: `당신은 30년 경력의 명리학 거장입니다.\n아래 사주의 재물운과 연애운을 분석해주세요.\n${pillarsStr}\n\nJSON으로 응답해주세요.`,
    } as const;

    return prompts[step];
  }

  private async callGemini<T>(prompt: string): Promise<T> {
    const model = getGeminiModel();

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // 토큰 사용량 추출 및 누적
    const usageMetadata = result.response.usageMetadata;
    if (usageMetadata) {
      this.context.addTokenUsage(
        usageMetadata.promptTokenCount ?? 0,
        usageMetadata.candidatesTokenCount ?? 0
      );
    }

    return this.parseJsonResponse<T>(result.response.text());
  }

  private parseJsonResponse<T>(responseText: string): T {
    try {
      let jsonString = responseText.trim();
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
      }
      return JSON.parse(jsonString) as T;
    } catch (error) {
      throw new Error(
        `JSON 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  private buildFinalResult(): SajuAnalysisResult {
    const { basicAnalysis, personality, aptitude, fortune, scores } =
      this.context.intermediateResults;

    return {
      summary: basicAnalysis?.summary || '분석 결과를 생성했습니다.',
      personality: {
        title: '성격 분석',
        content: personality
          ? `${personality.outerPersonality}\n\n${personality.innerPersonality}`
          : '성격 분석 결과',
        keywords: aptitude?.keywords || [],
      },
      wealth: {
        title: '재물운',
        content: fortune?.wealth?.pattern || '재물운 분석 결과',
        score: scores?.aptitude?.business ?? 50,
        advice: fortune?.wealth?.advice || '',
      },
      love: {
        title: '연애운',
        content: fortune?.love?.style || '연애운 분석 결과',
        score: scores?.love?.emotion ?? 50,
        advice: fortune?.love?.warnings?.join(', ') || '',
      },
      career: {
        title: '직업운',
        content: aptitude?.talents?.join(', ') || '직업운 분석 결과',
        score: scores?.work?.execution ?? 50,
        advice: aptitude?.recommendedFields?.join(', ') || '',
      },
      health: {
        title: '건강운',
        content: '건강운 분석 결과',
        score: 50,
        advice: '규칙적인 생활 습관을 유지하세요.',
      },
      yearly_flow: [],
      classical_references: [
        {
          source: '자평진전',
          quote: basicAnalysis?.usefulGod?.reasoning || '',
          interpretation: `용신: ${basicAnalysis?.usefulGod?.primary}, 희신: ${basicAnalysis?.usefulGod?.secondary}`,
        },
      ],
    };
  }

  private handleError(error: unknown): GeminiApiError {
    if (error instanceof Error) {
      if (error.message === 'TIMEOUT') {
        return {
          code: 'TIMEOUT',
          message: 'AI 분석 시간이 초과되었습니다.',
        };
      }
      return { code: 'API_ERROR', message: error.message };
    }
    return { code: 'UNKNOWN_ERROR', message: '알 수 없는 오류가 발생했습니다' };
  }
}

/**
 * AnalysisPipeline 팩토리 함수
 */
export function createAnalysisPipeline(options?: PipelineOptions): AnalysisPipeline {
  return new AnalysisPipeline(options);
}

// 타입 및 유틸리티 re-export
export { PipelineContext } from './context';
export { StepExecutor } from './step-executor';
export * from './types';
