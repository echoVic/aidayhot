
interface LadderIconProps {
  size?: number;
  className?: string;
  showError?: boolean;
}

export default function LadderIcon({ 
  size = 120, 
  className = "text-indigo-500",
  showError = false 
}: LadderIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 梯子的左侧竖杆 */}
      <rect
        x="25"
        y="10"
        width="8"
        height="100"
        fill="currentColor"
        className="opacity-80"
      />
      {/* 梯子的右侧竖杆 */}
      <rect
        x="87"
        y="10"
        width="8"
        height="100"
        fill="currentColor"
        className="opacity-80"
      />
      {/* 梯子的横档 */}
      <rect x="25" y="20" width="70" height="6" fill="currentColor" />
      <rect x="25" y="35" width="70" height="6" fill="currentColor" />
      <rect x="25" y="50" width="70" height="6" fill="currentColor" />
      <rect x="25" y="65" width="70" height="6" fill="currentColor" />
      <rect x="25" y="80" width="70" height="6" fill="currentColor" />
      <rect x="25" y="95" width="70" height="6" fill="currentColor" />
      
      {/* 根据情况显示不同的装饰 */}
      {showError ? (
        // 错误标志
        <>
          <circle cx="60" cy="55" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-60" />
          <path d="M52 47 L68 63 M68 47 L52 63" stroke="currentColor" strokeWidth="3" className="opacity-60" />
        </>
      ) : (
        // 工具图标装饰
        <>
          <circle cx="105" cy="25" r="3" fill="currentColor" className="opacity-60" />
          <circle cx="15" cy="35" r="2" fill="currentColor" className="opacity-60" />
          <rect x="12" y="70" width="6" height="2" fill="currentColor" className="opacity-60" />
          <rect x="102" y="85" width="8" height="2" fill="currentColor" className="opacity-60" />
        </>
      )}
    </svg>
  );
} 