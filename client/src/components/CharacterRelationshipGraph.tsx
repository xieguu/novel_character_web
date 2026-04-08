import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { Character, CharacterRelationship } from "@shared/types";

interface CharacterRelationshipGraphProps {
  characters: Character[];
  relationships: CharacterRelationship[];
  onCharacterClick?: (character: Character) => void;
}

export default function CharacterRelationshipGraph({
  characters,
  relationships,
  onCharacterClick,
}: CharacterRelationshipGraphProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || characters.length === 0) return;

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 准备节点数据
    const nodes = characters.map((char) => ({
      id: char.id.toString(),
      name: char.name,
      value: char.name,
      symbolSize: 40,
      itemStyle: {
        color: "#4F46E5",
      },
      label: {
        show: true,
        fontSize: 12,
        color: "#000",
      },
    }));

    // 准备边数据
    const links = relationships.map((rel) => ({
      source: rel.characterId1.toString(),
      target: rel.characterId2.toString(),
      label: {
        show: true,
        content: rel.relationshipType,
        fontSize: 10,
        color: "#666",
      },
      lineStyle: {
        width: 2,
        color: "#999",
      },
    }));

    const option: echarts.EChartsOption = {
      title: {
        text: "人物关系网络图",
        left: "center",
        top: 10,
      },
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          if (params.dataType === "node") {
            return `<div>${params.name}</div>`;
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
          label: {
            position: "right",
            formatter: "{b}",
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: {
              width: 3,
              color: "#FF6B6B",
            },
          },
          force: {
            repulsion: 300,
            gravity: 0.1,
            edgeLength: 150,
          },
        },
      ],
    };

    chartInstance.current.setOption(option);

    // 处理点击事件
    const handleClick = (params: any) => {
      if (params.dataType === "node") {
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
    <div
      ref={chartRef}
      className="w-full h-96 border border-gray-200 rounded-lg"
    />
  );
}
