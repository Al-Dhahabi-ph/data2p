import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ExternalLink, Maximize } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { convertGoogleDriveLink, convertYouTubeLink, isYouTubeLink, isGoogleDriveLink } from '@/utils/linkConverter';

interface Resource {
  id: string;
  title: string;
  type: 'file' | 'audio' | 'video';
  originalUrl: string;
}

const DataDisplay = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [convertedLinks, setConvertedLinks] = useState<{
    embedUrl: string;
    downloadUrl?: string;
    viewUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!resourceId) return;

    // Find the resource across all parent items
    const resourcesRef = ref(database, 'resources');

    const unsubscribe = onValue(resourcesRef, (snapshot) => {
      if (snapshot.exists()) {
        const resourcesData = snapshot.val();
        let foundResource = null;

        // Search through all parent items to find the resource
        for (const parentId of Object.keys(resourcesData)) {
          const parentResources = resourcesData[parentId];
          if (parentResources && parentResources[resourceId]) {
            foundResource = { 
              id: resourceId, 
              ...parentResources[resourceId],
              parentId 
            };
            break;
          }
        }

        if (foundResource) {
          setResource(foundResource);

          // Convert links based on type
          if (isYouTubeLink(foundResource.originalUrl)) {
            const converted = convertYouTubeLink(foundResource.originalUrl);
            setConvertedLinks({
              embedUrl: converted.embedUrl,
              viewUrl: converted.viewUrl
            });
          } else if (isGoogleDriveLink(foundResource.originalUrl)) {
            const converted = convertGoogleDriveLink(foundResource.originalUrl);
            setConvertedLinks({
              embedUrl: converted.embedUrl,
              downloadUrl: converted.downloadUrl,
              viewUrl: converted.viewUrl
            });
          } else {
            // Fallback for other links
            setConvertedLinks({
              embedUrl: foundResource.originalUrl,
              viewUrl: foundResource.originalUrl
            });
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [resourceId]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleDownload = () => {
    if (convertedLinks?.downloadUrl) {
      window.open(convertedLinks.downloadUrl, '_blank');
    }
  };

  const handleOpenNewTab = () => {
    if (convertedLinks?.viewUrl) {
      window.open(convertedLinks.viewUrl, '_blank');
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const leftAction = (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={handleBackClick}
      className="hover:bg-accent/10"
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );

  if (loading) {
    return (
      <Layout title="Loading..." leftAction={leftAction}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading resource...</p>
        </div>
      </Layout>
    );
  }

  if (!resource || !convertedLinks) {
    return (
      <Layout title="Resource Not Found" leftAction={leftAction}>
        <div className="text-center py-12">
          <p className="text-destructive">Resource not found</p>
        </div>
      </Layout>
    );
  }

  const isYouTube = isYouTubeLink(resource.originalUrl);

  return (
    <Layout title={resource.title} leftAction={leftAction}>
      <div className="space-y-6">
        {/* Iframe Container */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'w-full'}`}>
          <div className={`relative w-full ${isFullscreen ? 'h-full' : ''}`} style={!isFullscreen ? { paddingBottom: '56.25%' } : {}}>
            <iframe
              src={convertedLinks.embedUrl}
              className={`${isFullscreen ? 'w-full h-full' : 'absolute top-0 left-0 w-full h-full'} rounded-lg border border-border`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={resource.title}
            />
            {/* Floating Fullscreen Button */}
            <Button
              onClick={handleFullscreen}
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 md:top-4 md:right-4 z-20 bg-background/90 hover:bg-background shadow-lg border-2 border-border/50 w-10 h-10 md:w-8 md:h-8"
            >
              <Maximize className="w-5 h-5 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isYouTube && convertedLinks.downloadUrl && (
            <Button 
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
          )}
          
          <Button 
            onClick={handleOpenNewTab}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Tab</span>
          </Button>
        </div>

        {/* Resource Info */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{resource.title}</h2>
          <p className="text-sm text-muted-foreground capitalize">
            {resource.type} Resource
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default DataDisplay;