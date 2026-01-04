'use client';

/**
 * 길흉일 캘린더 컴포넌트
 * Task 20: 월별 3-5개 길일 + 1-3개 흉일 표시
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, AlertTriangle, Calendar } from 'lucide-react';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { MonthlyFortune, LuckyDay, UnluckyDay } from '@/lib/ai/types';

interface LuckyDaysCalendarProps {
  /** 월별 운세 데이터 (길흉일 포함) */
  monthlyFortunes: MonthlyFortune[];
  /** 분석 대상 연도 */
  year: number;
}

/** 요일 이름 */
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/** 월 이름 */
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

/** 날짜에서 일자 추출 */
function extractDay(dateStr: string): number {
  // "2026-01-15" 또는 "15일" 형식 처리
  if (dateStr.includes('-')) {
    const day = dateStr.split('-')[2];
    return day ? parseInt(day, 10) : 0;
  }
  const match = dateStr.match(/(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

export function LuckyDaysCalendar({ monthlyFortunes, year }: LuckyDaysCalendarProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(
    year === currentYear ? currentMonth : 1
  );

  const monthFortune = monthlyFortunes.find((m) => m.month === selectedMonth);
  const luckyDays = monthFortune?.luckyDays || [];
  const unluckyDays = monthFortune?.unluckyDays || [];

  // 해당 월의 첫째 날과 마지막 날
  const firstDay = new Date(year, selectedMonth - 1, 1);
  const lastDay = new Date(year, selectedMonth, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  // 길흉일 맵 생성
  const luckyDayMap = new Map<number, LuckyDay>();
  const unluckyDayMap = new Map<number, UnluckyDay>();

  luckyDays.forEach((d) => {
    const day = extractDay(d.date);
    if (day > 0 && day <= daysInMonth) {
      luckyDayMap.set(day, d);
    }
  });

  unluckyDays.forEach((d) => {
    const day = extractDay(d.date);
    if (day > 0 && day <= daysInMonth) {
      unluckyDayMap.set(day, d);
    }
  });

  const handlePrevMonth = () => {
    if (selectedMonth > 1) setSelectedMonth(selectedMonth - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonth < 12) setSelectedMonth(selectedMonth + 1);
  };

  // 캘린더 그리드 생성
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
    >
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
        >
          <Calendar className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-gray-900">길흉일 캘린더</h3>
          <p className="text-sm text-gray-500">중요한 날들을 미리 확인하세요</p>
        </div>
      </div>

      {/* 월 네비게이션 */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          disabled={selectedMonth === 1}
          className="rounded-full p-2 transition-colors hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h4 className="font-serif text-xl font-semibold text-gray-900">
          {year}년 {MONTH_NAMES[selectedMonth - 1]}
        </h4>
        <button
          onClick={handleNextMonth}
          disabled={selectedMonth === 12}
          className="rounded-full p-2 transition-colors hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* 범례 */}
      <div className="mb-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">길일 ({luckyDays.length}일)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600">주의일 ({unluckyDays.length}일)</span>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {DAY_NAMES.map((day, i) => (
          <div
            key={day}
            className={`py-2 text-center text-sm font-medium ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isLucky = luckyDayMap.has(day);
          const isUnlucky = unluckyDayMap.has(day);
          const luckyInfo = luckyDayMap.get(day);
          const unluckyInfo = unluckyDayMap.get(day);
          const dayOfWeek = (startDayOfWeek + day - 1) % 7;
          const isToday =
            year === currentYear &&
            selectedMonth === currentMonth &&
            day === currentDate.getDate();

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.01 * day }}
              className={`group relative aspect-square cursor-pointer rounded-lg p-1 transition-all ${
                isLucky
                  ? 'bg-green-100 hover:bg-green-200'
                  : isUnlucky
                    ? 'bg-red-100 hover:bg-red-200'
                    : 'hover:bg-gray-100'
              } ${isToday ? 'ring-2 ring-[#d4af37]' : ''}`}
            >
              <div className="flex h-full flex-col items-center justify-center">
                <span
                  className={`text-sm font-medium ${
                    dayOfWeek === 0
                      ? 'text-red-500'
                      : dayOfWeek === 6
                        ? 'text-blue-500'
                        : 'text-gray-700'
                  }`}
                >
                  {day}
                </span>
                {isLucky && <Star className="mt-0.5 h-3 w-3 text-green-600" />}
                {isUnlucky && <AlertTriangle className="mt-0.5 h-3 w-3 text-red-600" />}
              </div>

              {/* 툴팁 */}
              {(isLucky || isUnlucky) && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-48 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg group-hover:block">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedMonth}월 {day}일
                  </p>
                  {isLucky && luckyInfo && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-green-600">길일</p>
                      <p className="text-xs text-gray-600">{luckyInfo.reason}</p>
                      {luckyInfo.suitableFor && luckyInfo.suitableFor.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {luckyInfo.suitableFor.map((item, i) => (
                            <span
                              key={i}
                              className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {isUnlucky && unluckyInfo && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-red-600">주의일</p>
                      <p className="text-xs text-gray-600">{unluckyInfo.reason}</p>
                      {unluckyInfo.avoid && unluckyInfo.avoid.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {unluckyInfo.avoid.map((item, i) => (
                            <span
                              key={i}
                              className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 선택된 월의 중요 날짜 목록 */}
      <div className="mt-6 space-y-4">
        {/* 길일 목록 */}
        {luckyDays.length > 0 && (
          <div>
            <h5 className="mb-2 flex items-center gap-2 text-sm font-medium text-green-700">
              <Star className="h-4 w-4" />
              이달의 길일
            </h5>
            <div className="space-y-2">
              {luckyDays.map((day, i) => (
                <div key={i} className="rounded-lg bg-green-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-800">{day.date}</span>
                    {day.dayOfWeek && (
                      <span className="text-sm text-green-600">({day.dayOfWeek})</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-green-700">{day.reason}</p>
                  {day.suitableFor && day.suitableFor.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {day.suitableFor.map((item, j) => (
                        <span
                          key={j}
                          className="rounded-full bg-green-200 px-2 py-0.5 text-xs text-green-800"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 흉일 목록 */}
        {unluckyDays.length > 0 && (
          <div>
            <h5 className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
              <AlertTriangle className="h-4 w-4" />
              이달의 주의일
            </h5>
            <div className="space-y-2">
              {unluckyDays.map((day, i) => (
                <div key={i} className="rounded-lg bg-red-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-800">{day.date}</span>
                    {day.dayOfWeek && (
                      <span className="text-sm text-red-600">({day.dayOfWeek})</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-red-700">{day.reason}</p>
                  {day.avoid && day.avoid.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {day.avoid.map((item, j) => (
                        <span
                          key={j}
                          className="rounded-full bg-red-200 px-2 py-0.5 text-xs text-red-800"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
