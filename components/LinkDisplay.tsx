import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowIcon } from '@/components/Icons';

interface LinkOption {
  id: string;
  name: string;
  url: string;
}

interface LinkDisplayProps {
  links?: LinkOption[];
}

export const LinkDisplay: React.FC<LinkDisplayProps> = ({ links }) => {
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [availableLinks, setAvailableLinks] = useState<LinkOption[]>([]);

  useEffect(() => {
    if (links && links.length > 0) {
      setAvailableLinks(links);
      setSelectedLink(links[0].id);
    }
  }, [links]);

  const handleLinkClick = async (linkId: string, url: string) => {
    try {
      // Track the click
      await axios.post('/api/admin/links-config', { linkId });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    
    // Open link in new window
    window.open(url, '_blank');
  };

  if (availableLinks.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {availableLinks.map((link) => (
        <button
          key={link.id}
          onClick={() => handleLinkClick(link.id, link.url)}
          className="w-full p-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-between group"
        >
          <span className="flex items-center gap-2">
            📍 {link.name}
          </span>
          <ArrowIcon animate={true} />
        </button>
      ))}
    </div>
  );
};
