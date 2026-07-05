import React from 'react';

const shimmer = `
  @keyframes shimmer {
    0% { background-position: -600px 0 }
    100% { background-position: 600px 0 }
  }
`;

const base: React.CSSProperties = {
  background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
  backgroundSize: '600px 100%',
  animation: 'shimmer 1.4s ease infinite',
  borderRadius: 8,
};

export const SkeletonBox: React.FC<{
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = 16, style }) => (
  <>
    <style>{shimmer}</style>
    <div style={{ ...base, width, height, ...style }} />
  </>
);

export const SkeletonCard: React.FC = () => (
  <div style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #e5e7eb', display:'flex', flexDirection:'column', gap:12 }}>
    <style>{shimmer}</style>
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ ...base, width:40, height:40, borderRadius:'50%', flexShrink:0 }} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ ...base, height:14, width:'60%' }} />
        <div style={{ ...base, height:11, width:'40%' }} />
      </div>
    </div>
    <div style={{ ...base, height:12, width:'100%' }} />
    <div style={{ ...base, height:12, width:'75%' }} />
  </div>
);

export const SkeletonPage: React.FC<{ cards?: number }> = ({ cards = 4 }) => (
  <div style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
    <style>{shimmer}</style>
    <div style={{ ...base, height:28, width:200, marginBottom:8 }} />
    {Array.from({ length: cards }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);