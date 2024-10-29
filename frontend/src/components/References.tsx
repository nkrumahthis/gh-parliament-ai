import React, { useState } from 'react';
import { Reference } from "../types";
import { ChevronDown, ChevronUp, Youtube, Clock, ArrowUpRight } from 'lucide-react';

const References: React.FC<{ references: Reference[] }> = ({ references }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const PREVIEW_COUNT = 1;  // Number of references to show in preview

    if (!references || references.length === 0) return null;

    const shouldCollapse = references.length > PREVIEW_COUNT;
    const displayedReferences = isExpanded ? references : references.slice(0, PREVIEW_COUNT);

    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">References:</span>
                {shouldCollapse && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                Show less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                Show {references.length - PREVIEW_COUNT} more
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className={`space-y-2 ${!isExpanded && 'max-h-32 overflow-hidden'}`}>
                {displayedReferences.map((ref, idx) => (
                    <div
                        key={idx}
                        className="bg-gray-50 rounded p-2 text-xs"
                    >
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <a
                                href={ref.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                            >
                                <span>Watch</span>
                                <Youtube className="w-3 h-3" />
                                <span>{new URL(ref.video_url).searchParams.get('v')}</span>
                                <Clock className="w-3 h-3" />
                                <span>{ref.timestamp}</span>
                                <ArrowUpRight className="w-3 h-3" />
                            </a>
                        </div>
                        <div className="text-gray-700">
                            {ref.text}
                        </div>
                    </div>
                ))}

                {!isExpanded && shouldCollapse && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                )}
            </div>
        </div>
    );
};

export default References;