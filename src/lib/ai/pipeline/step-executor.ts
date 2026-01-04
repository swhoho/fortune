/**
 * StepExecutor - 단계 실행 관리
 * v2.1: AnalysisPipeline 클래스 분해
 *
 * 타임아웃, 재시도, 상태 업데이트 통합 관리
 */

import type { PipelineStep, GeminiApiError } from './types';
import { NON_RETRYABLE_ERROR_CODES } from './types';
import type { PipelineContext } from './context';

/**
 * StepExecutor 클래스
 * 단계 실행 + 타임아웃 + 재시도 통합
 */
export class StepExecutor {
  constructor(private context: PipelineContext) {}

  /**
   * 단계 실행 (타임아웃 + 재시도 포함)
   */
  async execute<T>(
    step: PipelineStep,
    executor: () => Promise<T>,
    options?: { skipRetry?: boolean }
  ): Promise<T> {
    this.context.updateStepStatus(step, 'in_progress');
    this.context.notifyProgress(step);

    const stepStart = Date.now();

    try {
      const result = await this.executeWithRetry(
        () => this.withTimeout(executor(), this.context.stepTimeouts[step]),
        options?.skipRetry ? 0 : this.context.retryCount,
        step
      );

      const duration = Date.now() - stepStart;
      this.context.markStepCompleted(step, duration);
      this.context.notifyStepComplete(step, result);
      this.context.notifyProgress(step);

      return result;
    } catch (error) {
      const duration = Date.now() - stepStart;
      this.context.markStepFailed(step, duration);
      this.context.notifyError(step, this.handleError(error));
      throw error;
    }
  }

  /**
   * 재시도 로직
   */
  private async executeWithRetry<T>(
    executor: () => Promise<T>,
    retryCount: number,
    step: PipelineStep
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      // 중단 확인
      if (this.context.isAborted()) {
        throw new Error('ABORTED');
      }

      try {
        return await executor();
      } catch (error) {
        lastError = error;
        const apiError = this.handleError(error);

        // 재시도 불가능한 에러인 경우 즉시 실패
        if (this.isNonRetryableError(apiError)) {
          throw error;
        }

        // 마지막 시도가 아니면 대기 후 재시도
        if (attempt < retryCount) {
          const waitTime = 1000 * (attempt + 1); // 점진적 대기
          console.log(
            `[StepExecutor] ${step} 재시도 ${attempt + 1}/${retryCount}... (${waitTime}ms 대기)`
          );
          await this.delay(waitTime);
        }
      }
    }

    throw lastError;
  }

  /**
   * 타임아웃 래퍼
   */
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    if (ms <= 0) return promise;

    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), ms)
      ),
    ]);
  }

  /**
   * 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 에러 핸들링
   */
  private handleError(error: unknown): GeminiApiError {
    if (error instanceof Error) {
      if (error.message === 'TIMEOUT') {
        return {
          code: 'TIMEOUT',
          message: 'AI 분석 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        };
      }

      if (error.message === 'ABORTED') {
        return {
          code: 'ABORTED',
          message: '분석이 중단되었습니다.',
        };
      }

      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        return {
          code: 'INVALID_API_KEY',
          message: 'AI 서비스 설정에 문제가 있습니다.',
        };
      }

      if (error.message.includes('quota') || error.message.includes('rate')) {
        return {
          code: 'RATE_LIMIT',
          message: 'AI 서비스 요청 한도를 초과했습니다.',
        };
      }

      if (error.message.includes('JSON')) {
        return {
          code: 'PARSE_ERROR',
          message: 'AI 응답 처리 중 오류가 발생했습니다.',
          details: error.message,
        };
      }

      return {
        code: 'API_ERROR',
        message: error.message,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: '알 수 없는 오류가 발생했습니다',
    };
  }

  /**
   * 재시도 불가능한 에러 판별
   */
  private isNonRetryableError(error: GeminiApiError): boolean {
    return NON_RETRYABLE_ERROR_CODES.includes(
      error.code as (typeof NON_RETRYABLE_ERROR_CODES)[number]
    );
  }
}
