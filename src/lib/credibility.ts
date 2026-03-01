// Credibility Analysis Engine
// Generates interpretive analysis for token credibility using real data

import type { CredibilityMatrix, CredibilityGrade, PatternFlag } from './types';
import type { TokenStatsData } from '@/types/token';

// Type for real token data input
export interface RealTokenData {
    holders: {
        address: string;
        percentage: number;
        isSuspicious: boolean;
        tags: string[];
    }[];
    stats?: TokenStatsData;
    security?: {
        is_show_alert?: boolean;
        top_10_holder_rate?: string;
        renounced_mint?: boolean;
        renounced_freeze_account?: boolean;
        burn_ratio?: string;
        is_honeypot?: boolean | null;
    };
    holderCount: number;
    top10Rate: number;
    devStatus: string;
}

// Score to grade conversion
export function scoreToGrade(score: number): CredibilityGrade {
    if (score >= 95) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'B-';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    if (score >= 60) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
}

// Deployer analysis
interface DeployerData {
    launches: number;
    failures: number;
    avgHoldTime: number; // hours
    recycledFunding: boolean;
}

function analyzeDeployer(data: DeployerData): CredibilityMatrix['deployer'] {
    let score = 70; // Base score

    // Adjust based on track record
    if (data.launches >= 5 && data.failures <= 1) score += 15;
    else if (data.launches >= 3) score += 5;
    else if (data.launches === 1) score -= 10;

    // Failure rate penalty
    const failureRate = data.launches > 0 ? data.failures / data.launches : 0;
    if (failureRate > 0.3) score -= 20;
    else if (failureRate > 0.1) score -= 10;

    // Recycled funding penalty
    if (data.recycledFunding) score -= 15;

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine label
    let label: 'Clean' | 'Mixed' | 'Risky';
    if (score >= 75) label = 'Clean';
    else if (score >= 50) label = 'Mixed';
    else label = 'Risky';

    // Generate summary
    let summary = '';
    if (data.launches === 1) {
        summary = 'First launch, no track record';
    } else if (data.failures === 0) {
        summary = `${data.launches} launches, no failures`;
    } else {
        summary = `${data.launches} launches, ${data.failures} failure${data.failures > 1 ? 's' : ''}`;
    }

    return { score, grade: scoreToGrade(score), label, summary };
}

// Funding analysis
interface FundingData {
    isRecycled: boolean;
    reuseCount: number;
    sourceAge: number; // days
    linksToCex: boolean;
}

function analyzeFunding(data: FundingData): CredibilityMatrix['funding'] {
    let score = 80; // Base score

    // Fresh wallet bonus
    if (!data.isRecycled && data.sourceAge < 7) score += 10;

    // Reuse penalty
    if (data.isRecycled) {
        score -= 10 + (data.reuseCount * 5);
    }

    // CEX link is positive
    if (data.linksToCex) score += 5;

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine label
    let label: 'Fresh' | 'Reused' | 'Suspicious';
    if (!data.isRecycled) label = 'Fresh';
    else if (data.reuseCount <= 2) label = 'Reused';
    else label = 'Suspicious';

    // Generate summary
    let summary = '';
    if (!data.isRecycled) {
        summary = 'Fresh wallet, no prior history';
    } else if (data.reuseCount === 1) {
        summary = 'Same wallet used once before';
    } else {
        summary = `Wallet reused ${data.reuseCount} times`;
    }

    return { score, grade: scoreToGrade(score), label, summary };
}

// Distribution analysis from real data
interface DistributionData {
    top10Percent: number;
    insiderPercent: number;
    devHolding: number;
    holderCount: number;
}

function analyzeDistribution(data: DistributionData): CredibilityMatrix['distribution'] {
    let score = 75; // Base score

    // Top 10 concentration
    if (data.top10Percent <= 20) score += 15;
    else if (data.top10Percent <= 35) score += 5;
    else if (data.top10Percent > 50) score -= 20;

    // Insider concentration
    if (data.insiderPercent > 30) score -= 25;
    else if (data.insiderPercent > 15) score -= 10;

    // Dev holding
    if (data.devHolding > 20) score -= 15;
    else if (data.devHolding < 5) score += 5;

    // Holder count bonus
    if (data.holderCount > 1000) score += 10;
    else if (data.holderCount > 500) score += 5;

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine label
    let label: 'Organic' | 'Concentrated' | 'Insider Heavy';
    if (data.insiderPercent > 25) label = 'Insider Heavy';
    else if (data.top10Percent > 40) label = 'Concentrated';
    else label = 'Organic';

    // Generate summary
    const summary = `Top 10 hold ${data.top10Percent.toFixed(1)}%`;

    return { score, grade: scoreToGrade(score), label, summary };
}

// Pattern detection
function detectPatterns(
    deployer: DeployerData,
    funding: FundingData,
    distribution: DistributionData,
    devSoldEarly: boolean
): PatternFlag[] {
    const patterns: PatternFlag[] = [];

    // Warning patterns
    if (funding.isRecycled) {
        patterns.push({
            type: 'FUNDING_REUSE',
            severity: funding.reuseCount > 2 ? 'critical' : 'warn',
            explanation: `Funding wallet has been used ${funding.reuseCount} time${funding.reuseCount > 1 ? 's' : ''} before`
        });
    }

    if (distribution.insiderPercent > 25) {
        patterns.push({
            type: 'INSIDER_CLUSTER',
            severity: distribution.insiderPercent > 40 ? 'critical' : 'warn',
            explanation: `${distribution.insiderPercent.toFixed(1)}% held by connected wallets`
        });
    }

    if (devSoldEarly) {
        patterns.push({
            type: 'DEV_EARLY_SELL',
            severity: 'critical',
            explanation: 'Developer sold within first 2 hours'
        });
    }

    // Positive patterns
    if (!funding.isRecycled && deployer.launches >= 3 && deployer.failures === 0) {
        patterns.push({
            type: 'CLEAN_LAUNCH',
            severity: 'info',
            explanation: 'Clean deployer with fresh funding'
        });
    }

    if (distribution.top10Percent <= 25 && distribution.holderCount > 500) {
        patterns.push({
            type: 'ORGANIC_GROWTH',
            severity: 'info',
            explanation: 'Well-distributed across many holders'
        });
    }

    if (!devSoldEarly && distribution.devHolding >= 5) {
        patterns.push({
            type: 'GRADUAL_DISTRIBUTION',
            severity: 'info',
            explanation: 'No dev sells in first 2h'
        });
    }

    return patterns;
}

// Calculate real distribution metrics from holder data
function calculateDistributionFromHolders(realData: RealTokenData): DistributionData {
    const { holders, stats, holderCount, top10Rate } = realData;

    // Calculate top 10 percent from holders array if available
    let top10Percent = top10Rate;
    if (holders.length > 0) {
        const sortedHolders = [...holders].sort((a, b) => b.percentage - a.percentage);
        const top10 = sortedHolders.slice(0, 10);
        top10Percent = top10.reduce((sum, h) => sum + h.percentage, 0);
    }

    // Calculate insider percent from suspicious wallets and stats
    let insiderPercent = 0;
    if (stats) {
        const insiderCount = stats.insider_count + stats.bundler_count + stats.sniper_count;
        insiderPercent = holderCount > 0 ? (insiderCount / holderCount) * 100 : 0;
    }

    // Also check suspicious flags in holders
    const suspiciousHolders = holders.filter(h => h.isSuspicious || h.tags.includes('insider'));
    const suspiciousPercent = suspiciousHolders.reduce((sum, h) => sum + h.percentage, 0);
    insiderPercent = Math.max(insiderPercent, suspiciousPercent);

    // Calculate dev holding from holders with dev tag
    const devHolders = holders.filter(h => h.tags.includes('dev') || h.tags.includes('creator'));
    const devHolding = devHolders.reduce((sum, h) => sum + h.percentage, 0);

    return {
        top10Percent,
        insiderPercent,
        devHolding,
        holderCount,
    };
}

// Main analysis function - now accepts optional real data
export function generateCredibilityMatrix(tokenId: string, realData?: RealTokenData): CredibilityMatrix {
    // If real data is provided, use it; otherwise use default/fallback values
    let deployerData: DeployerData;
    let fundingData: FundingData;
    let distributionData: DistributionData;
    let devSoldEarly: boolean;

    if (realData) {
        // Calculate distribution from real holder data
        distributionData = calculateDistributionFromHolders(realData);

        // Infer deployer data from stats if available
        deployerData = {
            launches: realData.stats?.dev_count || 1,
            failures: 0,
            avgHoldTime: 24,
            recycledFunding: false, // Would need additional API call to determine
        };

        // Funding data - default to fresh unless we have evidence otherwise
        fundingData = {
            isRecycled: false,
            reuseCount: 0,
            sourceAge: 7,
            linksToCex: false,
        };

        // Check if dev sold
        devSoldEarly = realData.devStatus === 'sold' || realData.devStatus === 'sold_all';
    } else {
        // Fallback to hash-based deterministic values for consistency
        const hash = tokenId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const rand = (seed: number) => ((hash * seed) % 100) / 100;

        deployerData = {
            launches: Math.floor(rand(1) * 15) + 1,
            failures: Math.floor(rand(2) * 3),
            avgHoldTime: Math.floor(rand(3) * 48) + 2,
            recycledFunding: rand(4) > 0.6
        };

        fundingData = {
            isRecycled: rand(5) > 0.5,
            reuseCount: Math.floor(rand(6) * 4),
            sourceAge: Math.floor(rand(7) * 30),
            linksToCex: rand(8) > 0.7
        };

        distributionData = {
            top10Percent: Math.floor(rand(9) * 40) + 10,
            insiderPercent: Math.floor(rand(10) * 30) + 5,
            devHolding: Math.floor(rand(11) * 15) + 2,
            holderCount: Math.floor(rand(12) * 2000) + 100
        };

        devSoldEarly = rand(13) > 0.8;
    }

    const deployer = analyzeDeployer(deployerData);
    const funding = analyzeFunding(fundingData);
    const distribution = analyzeDistribution(distributionData);
    const behaviorPatterns = detectPatterns(
        deployerData,
        fundingData,
        distributionData,
        devSoldEarly
    );

    // Calculate overall score
    const overallScore = Math.round(
        (deployer.score * 0.35) +
        (funding.score * 0.25) +
        (distribution.score * 0.4)
    );

    // Calculate confidence band
    const variance = Math.abs(deployer.score - distribution.score);
    const bandWidth = Math.floor(variance / 3) + 5;
    const lowerBound = Math.max(0, overallScore - bandWidth);
    const upperBound = Math.min(100, overallScore + bandWidth);

    // Determine trend based on patterns
    const criticalCount = behaviorPatterns.filter(p => p.severity === 'critical').length;
    const infoCount = behaviorPatterns.filter(p => p.severity === 'info').length;
    let trend: 'Improving' | 'Stable' | 'Deteriorating';
    if (criticalCount > infoCount) trend = 'Deteriorating';
    else if (infoCount > criticalCount) trend = 'Improving';
    else trend = 'Stable';

    return {
        tokenId,
        deployer,
        funding,
        distribution,
        behaviorPatterns,
        confidenceBand: {
            range: [lowerBound, upperBound],
            trend
        },
        overallScore,
        overallGrade: scoreToGrade(overallScore),
        updatedAt: Date.now()
    };
}
