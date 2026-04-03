"use client";

import React, { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  MarkerType,
} from '@xyflow/react';
import dagre from 'dagre';
import { Person, Relationship } from '@/types';

const nodeWidth = 180;
const nodeHeight = 60;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };

    newNode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

export default function NetworkTree({
  personsMap,
  relationships,
}: {
  personsMap: Map<string, Person>;
  relationships: Relationship[];
}) {
  const initialNodes = useMemo(() => {
    return Array.from(personsMap.values()).map(person => ({
      id: person.id,
      data: { label: person.full_name },
      position: { x: 0, y: 0 },
      style: {
        background: person.gender === 'male' ? '#e0f2fe' : person.gender === 'female' ? '#ffe4e6' : '#f5f5f4',
        border: '1px solid #d6d3d1',
        borderRadius: '8px',
        padding: '10px',
        fontWeight: 'bold',
        color: '#1c1917',
        width: nodeWidth,
        textAlign: 'center' as const
      }
    }));
  }, [personsMap]);

  const initialEdges = useMemo(() => {
    return relationships
      .filter(r => personsMap.has(r.person_a) && personsMap.has(r.person_b))
      .map(r => {
        if (r.type === 'marriage') {
          return {
            id: r.id,
            source: r.person_a,
            target: r.person_b,
            type: 'straight',
            style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' },
            animated: true,
            label: 'Vợ/Chồng',
            labelStyle: { fill: '#b45309', fontWeight: 700, fontSize: 10 },
          };
        } else {
          return {
            id: r.id,
            source: r.person_a,
            target: r.person_b,
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#a8a29e',
            },
            style: { stroke: '#a8a29e', strokeWidth: 2 },
          };
        }
      });
  }, [relationships, personsMap]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full min-h-[70vh] bg-stone-50/50 rounded-2xl border border-stone-200 overflow-hidden relative shadow-inner">
      <div className="absolute top-2 right-2 z-50 bg-black/80 text-white p-2 rounded text-xs font-mono">
        DEBUG: personsMap={personsMap.size}, layoutedNodes={layoutedNodes.length}, nodes={nodes.length}, edges={edges.length}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap zoomable pannable nodeColor={(n) => {
          if (n.style?.background === '#e0f2fe') return '#38bdf8';
          if (n.style?.background === '#ffe4e6') return '#fb7185';
          return '#a8a29e';
        }} />
        <Background gap={16} size={1} />
      </ReactFlow>
      
      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur text-xs p-3 rounded-lg border border-stone-200 shadow-sm pointer-events-none">
        <h4 className="font-bold text-stone-700 mb-2">Chú giải</h4>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-[#e0f2fe] border border-stone-300 rounded-sm"></div>
          <span>Nam</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-[#ffe4e6] border border-stone-300 rounded-sm"></div>
          <span>Nữ</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 border-t-2 border-stone-400"></div>
          <span>Cha mẹ - Con</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 border-t-2 border-amber-500 border-dashed"></div>
          <span>Vợ chồng</span>
        </div>
      </div>
    </div>
  );
}
