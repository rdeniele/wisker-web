"use client";

import React, { useEffect, useState } from "react";

interface DailyActivity {
  date: string;
  count: number;
}

interface LearningTool {
  createdAt: string;
}

function LineGraph() {
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        // Get last 7 days of activity
        const response = await fetch("/api/learning-tools?pageSize=100");
        const result = await response.json();

        if (response.ok && result.data.learningTools) {
          // Process data into daily counts for last 7 days
          const last7Days: DailyActivity[] = [];
          const today = new Date();

          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const dayStr = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            const count = result.data.learningTools.filter(
              (tool: LearningTool) => {
                const toolDate = new Date(tool.createdAt);
                toolDate.setHours(0, 0, 0, 0);
                return toolDate.getTime() === date.getTime();
              },
            ).length;

            last7Days.push({ date: dayStr, count });
          }

          setActivityData(last7Days);
        }
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityData();
  }, []);

  const maxCount = Math.max(...activityData.map((d) => d.count), 1);
  const chartHeight = 200;

  return (
    <div className="w-full">
      <h2
        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4"
        style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
      >
        Your Activity
      </h2>
      <div
        className="bg-white p-8 rounded-2xl border-2 border-gray-100 min-h-[300px]"
        style={{
          fontFamily: "Fredoka, Arial, sans-serif",
          boxShadow: "0 4px 0 #ececec",
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-[236px]">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart */}
            <div className="relative" style={{ height: `${chartHeight}px` }}>
              <svg
                width="100%"
                height={chartHeight}
                className="overflow-visible"
              >
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const y = (chartHeight / 4) * i;
                  return (
                    <g key={`grid-${i}`}>
                      <line
                        x1="0"
                        y1={y}
                        x2="100%"
                        y2={y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray={i === 0 ? "0" : "4 4"}
                      />
                      <text
                        x="-8"
                        y={y + 4}
                        fontSize="10"
                        fill="#9ca3af"
                        textAnchor="end"
                      >
                        {Math.round(maxCount - (i / 4) * maxCount)}
                      </text>
                    </g>
                  );
                })}

                {/* Line path */}
                {activityData.length > 0 && (
                  <>
                    <defs>
                      <linearGradient
                        id="lineGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#FF6B35"
                          stopOpacity="0.4"
                        />
                        <stop
                          offset="50%"
                          stopColor="#FFB088"
                          stopOpacity="0.2"
                        />
                        <stop
                          offset="100%"
                          stopColor="#FFE8CC"
                          stopOpacity="0.05"
                        />
                      </linearGradient>
                    </defs>

                    {/* Area under the line */}
                    <path
                      d={
                        activityData
                          .map((d, i) => {
                            const x = (i / (activityData.length - 1)) * 100;
                            const y =
                              chartHeight - (d.count / maxCount) * chartHeight;
                            return i === 0 ? `M ${x}% ${y}` : `L ${x}% ${y}`;
                          })
                          .join(" ") +
                        ` L 100% ${chartHeight} L 0 ${chartHeight} Z`
                      }
                      fill="url(#lineGradient)"
                    />

                    {/* Line */}
                    <path
                      d={activityData
                        .map((d, i) => {
                          const x = (i / (activityData.length - 1)) * 100;
                          const y =
                            chartHeight - (d.count / maxCount) * chartHeight;
                          return i === 0 ? `M ${x}% ${y}` : `L ${x}% ${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#FF6B35"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {activityData.map((d, i) => {
                      const x = (i / (activityData.length - 1)) * 100;
                      const y =
                        chartHeight - (d.count / maxCount) * chartHeight;
                      return (
                        <g key={`point-${i}`}>
                          <circle
                            cx={`${x}%`}
                            cy={y}
                            r="6"
                            fill="white"
                            stroke="#FF6B35"
                            strokeWidth="3"
                          />
                          <circle cx={`${x}%`} cy={y} r="3" fill="#FF6B35" />
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-gray-500 font-medium px-1">
              {activityData.map((d, i) => (
                <span key={`label-${i}`} className="text-center">
                  {d.date}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#FF6B35]">
                  {activityData.reduce((sum, d) => sum + d.count, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#FF6B35]">
                  {Math.max(...activityData.map((d) => d.count))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Best Day</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LineGraph;
