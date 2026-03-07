'use client';

import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";

interface ConnectionCardProps {
  handshakeId: string;
  name: string;
  role: string;
  status: 'pending' | 'approved';
  score?: number;
  createdAt: string;
}

export default function ConnectionCard({
  handshakeId,
  name,
  role,
  status,
  score,
  createdAt,
}: ConnectionCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/handshake-result/${handshakeId}`);
  };

  const date = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.button
      onClick={handleClick}
      className="w-full card-surface p-3 text-left hover:border-primary/30 transition-all group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-bold text-foreground">
              {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
            <p className="text-xs text-muted-foreground truncate">{role}</p>
          </div>
        </div>
        {score !== undefined && (
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-primary">{score}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">match</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs">
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-mono ${
          status === 'approved'
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}>
          {status === 'approved' ? 'Connected' : 'Pending'}
        </span>
        <span className="text-muted-foreground font-mono">{date}</span>
      </div>
    </motion.button>
  );
}
