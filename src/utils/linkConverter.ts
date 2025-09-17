// Utility functions to convert Google Drive and YouTube links

export const convertGoogleDriveLink = (originalUrl: string) => {
  try {
    // Extract file ID from various Google Drive URL formats
    const fileIdMatch = originalUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    
    if (!fileId) {
      return {
        embedUrl: originalUrl,
        downloadUrl: originalUrl,
        viewUrl: originalUrl
      };
    }

    return {
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      viewUrl: `https://drive.google.com/file/d/${fileId}/view`
    };
  } catch (error) {
    console.error('Error converting Google Drive link:', error);
    return {
      embedUrl: originalUrl,
      downloadUrl: originalUrl,
      viewUrl: originalUrl
    };
  }
};

export const convertYouTubeLink = (originalUrl: string) => {
  try {
    // Extract video ID from various YouTube URL formats
    const videoIdMatch = originalUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    
    if (!videoId) {
      return {
        embedUrl: originalUrl,
        viewUrl: originalUrl
      };
    }

    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      viewUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  } catch (error) {
    console.error('Error converting YouTube link:', error);
    return {
      embedUrl: originalUrl,
      viewUrl: originalUrl
    };
  }
};

export const isYouTubeLink = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

export const isGoogleDriveLink = (url: string): boolean => {
  return url.includes('drive.google.com');
};