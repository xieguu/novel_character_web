import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import type { Character, CharacterRelationship } from "@shared/types";

interface CharacterRelationshipGraphProps {
  characters: Character[];
  relationships: CharacterRelationship[];
  onCharacterClick?: (character: Character) => void;
}

export default function CharacterRelationshipGraphOptimized({
  characters,
  relationships,
  onCharacterClick,
}: CharacterRelationshipGraphProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!chartRef.current || characters.length === 0) return;

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, null, { renderer: "canvas" });
    }

    // 颜色方案
    const colors = ["#4F46E5", "#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#06B6D4"];
    const getColor = (index: number) => colors[index % colors.length];

    // 准备节点数据 - 优化样式
    const nodes = characters.map((char, index) => ({
      id: char.id.toString(),
      name: char.name,
      value: char.name,
      symbolSize: 50,
      itemStyle: {
        color: getColor(index),
        borderColor: "#fff",
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: getColor(index),
      },
      label: {
        show: true,
        fontSize: 13,
        fontWeight: 600 as any,
        color: "#fff",
        backgroundColor: getColor(index),
        borderRadius: 4,
        padding: [4, 8],
        shadowBlur: 8,
        shadowColor: "rgba(0,0,0,0.3)",
      } as any,
      emphasis: {
        itemStyle: {
          borderWidth: 3,
          shadowBlur: 15,
        },
      },
    }));

    // 准备边数据 - 优化样式
    const links = relationships.map((rel) => ({
      source: rel.characterId1.toString(),
      target: rel.characterId2.toString(),
      label: {
        show: true,
        formatter: rel.relationshipType,
        fontSize: 11,
        color: "#666",
        backgroundColor: "rgba(255,255,255,0.8)",
        borderRadius: 3,
        padding: [2, 6],
      },
      lineStyle: {
        width: 2.5,
        color: "rgba(100,100,100,0.4)",
        type: "solid",
      },
      emphasis: {
        lineStyle: {
          width: 4,
          color: "#F59E0B",
        },
      },
    } as any));

    const option: echarts.EChartsOption = {
      title: {
        text: "人物关系网络图",
        left: "center",
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: "bold",
          color: "#1F2937",
        },
        subtextStyle: {
          fontSize: 12,
          color: "#6B7280",
        },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(0,0,0,0.7)",
        borderColor: "rgba(255,255,255,0.2)",
        textStyle: {
          color: "#fff",
          fontSize: 12,
        },
        formatter: (params: any) => {
          if (params.dataType === "node") {
            const char = characters.find((c) => c.id.toString() === params.data.id);
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
                <div style="font-size: 11px; color: #ccc;">${char?.identity || "身份未知"}</div>
              </div>
            `;
          } else if (params.dataType === "edge") {
            return `<div style="padding: 4px; font-size: 12px;">${params.value}</div>`;
          }
          return "";
        },
      },
      series: [
        {
          type: "graph",
          layout: "force",
          data: nodes,
          links: links,
          roam: true,
          draggable: true,
          focusNodeAdjacency: true,
          label: {
            position: "inside",
            formatter: "{b}",
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: {
              width: 4,
              color: "#F59E0B",
            },
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 20,
            },
          },
          force: {
            repulsion: 400,
            gravity: 0.08,
            edgeLength: 180,
            friction: 0.6,
          },
          animation: true,
          animationDuration: 1000,
          animationEasing: "cubicOut",
        },
      ],
    };

    chartInstance.current.setOption(option);

    // 处理点击事件
    const handleClick = (params: any) => {
      if (params.dataType === "node") {
        setSelectedNode(params.data.id);
        const character = characters.find(
          (c) => c.id.toString() === params.data.id
        );
        if (character && onCharacterClick) {
          onCharacterClick(character);
        }
      }
    };

    chartInstance.current.off("click", handleClick);
    chartInstance.current.on("click", handleClick);

    // 响应式调整
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [characters, relationships, onCharacterClick]);

  return (
    <div className="w-full space-y-4">
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-4 border border-primary/20">
        <p className="text-sm text-muted-foreground">
          💡 提示：拖拽节点移动，滚轮缩放，点击节点查看详情。节点颜色表示不同的人物，连线表示人物之间的关系。
        </p>
      </div>
      <div
        ref={chartRef}
        className="w-full h-[600px] border-2 border-primary/20 rounded-xl bg-gradient-to-br from-background to-muted/30 shadow-lg"
      />
    </div>
  );
}
