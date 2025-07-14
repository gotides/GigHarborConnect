import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Images } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Photo } from "@shared/schema";

interface PhotoCarouselProps {
  className?: string;
}

export default function PhotoCarousel({ className = "" }: PhotoCarouselProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { data: photos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
  });

  // Filter out photos that might be corrupted or have issues
  const validPhotos = photos.filter(photo => photo.filename);

  // Rotate photos every 3 seconds
  useEffect(() => {
    if (validPhotos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex(prevIndex => 
        prevIndex >= validPhotos.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [validPhotos.length]);

  if (isLoading) {
    return (
      <Card className={`${className} h-64`}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="animate-pulse">
            <Images className="w-12 h-12 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (validPhotos.length === 0) {
    return (
      <Card className={`${className} h-64`}>
        <CardContent className="h-full flex flex-col items-center justify-center text-gray-500">
          <Images className="w-12 h-12 mb-2" />
          <p className="text-sm text-center">No team photos available</p>
          <p className="text-xs text-center mt-1">Upload photos in the Memories section</p>
        </CardContent>
      </Card>
    );
  }

  const currentPhoto = validPhotos[currentPhotoIndex];

  return (
    <Card className={`${className} h-64 overflow-hidden relative`}>
      <CardContent className="h-full p-0 relative">
        <img
          src={`/api/photos/${currentPhoto.id}/file`}
          alt={currentPhoto.title}
          className="w-full h-full object-cover transition-opacity duration-500"
          onError={(e) => {
            // If image fails to load, skip to next photo
            console.log(`Failed to load photo ${currentPhoto.id}`);
            setCurrentPhotoIndex(prevIndex => 
              prevIndex >= validPhotos.length - 1 ? 0 : prevIndex + 1
            );
          }}
        />
        
        {/* Photo overlay with title and indicators */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="text-white">
            <h3 className="text-sm font-medium truncate">{currentPhoto.title}</h3>
            {currentPhoto.event && (
              <p className="text-xs opacity-80 truncate">{currentPhoto.event}</p>
            )}
          </div>
          
          {/* Photo indicators */}
          {validPhotos.length > 1 && (
            <div className="flex gap-1 mt-2">
              {validPhotos.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Photo counter */}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {currentPhotoIndex + 1} / {validPhotos.length}
        </div>
      </CardContent>
    </Card>
  );
}