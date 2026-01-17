// Formatting utilities for the terminal

export function formatNumber(num: number): string {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

export function formatCurrency(num: number): string {
    return '$' + formatNumber(num);
}

export function formatPercent(num: number): string {
    return num.toFixed(0) + '%';
}

export function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
}

export function formatWallet(address: string, length: number = 4): string {
    if (address.length <= length * 2 + 3) return address;
    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

export function getScoreColor(score: number): string {
    if (score >= 80) return 'text-[#2ECC71]';
    if (score >= 60) return 'text-[#F1C40F]';
    if (score >= 40) return 'text-[#E67E22]';
    return 'text-[#E74C3C]';
}

export function getScoreBgColor(score: number): string {
    if (score >= 80) return 'bg-[#2ECC71]/20';
    if (score >= 60) return 'bg-[#F1C40F]/20';
    if (score >= 40) return 'bg-[#E67E22]/20';
    return 'bg-[#E74C3C]/20';
}

export function getSeverityColor(severity: string): string {
    switch (severity) {
        case 'critical': return 'text-[#E74C3C]';
        case 'warning': return 'text-[#F1C40F]';
        case 'success': return 'text-[#2ECC71]';
        default: return 'text-[#4C8DFF]';
    }
}

export function getSeverityBgColor(severity: string): string {
    switch (severity) {
        case 'critical': return 'bg-[#E74C3C]/20 border-[#E74C3C]/30';
        case 'warning': return 'bg-[#F1C40F]/20 border-[#F1C40F]/30';
        case 'success': return 'bg-[#2ECC71]/20 border-[#2ECC71]/30';
        default: return 'bg-[#4C8DFF]/20 border-[#4C8DFF]/30';
    }
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'live': return 'text-[#2ECC71]';
        case 'graduated': return 'text-[#8B5CF6]';
        case 'new': return 'text-[#4C8DFF]';
        case 'stealth': return 'text-[#F1C40F]';
        case 'rugged': return 'text-[#E74C3C]';
        default: return 'text-[#9AA0A6]';
    }
}

export function getStatusBgColor(status: string): string {
    switch (status) {
        case 'live': return 'bg-[#2ECC71]/20';
        case 'graduated': return 'bg-[#8B5CF6]/20';
        case 'new': return 'bg-[#4C8DFF]/20';
        case 'stealth': return 'bg-[#F1C40F]/20';
        case 'rugged': return 'bg-[#E74C3C]/20';
        default: return 'bg-white/5';
    }
}
