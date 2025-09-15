"use client"

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Billboard, Text, Html, AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import styles from './HeroSection.module.css';

import { useRouter } from 'next/navigation';
import { useSpring } from '@react-spring/three';



// Type for private repository location data
interface PrivateRepoLocationData {
  repoName: string;  // Name of the private repo
  location: string;
  latitude: number;
  longitude: number;
  iconUrl?: string;
  name?: string; // Friendly display name for the project
  projectSlug?: string; // Slug to link to /portfolio/projects/[projectSlug]
}

// TrustedBy removed from hero

// Enhanced location type with repo information
interface EnhancedLocation {
  lat: number;
  lng: number;
  name: string;
  repoName: string;
  iconUrl?: string;
  isPrivate?: boolean;  // Flag to identify private repos
  displayName?: string; // Friendly project name to display instead of repo name
  projectSlug?: string; // Direct slug to navigate to
}

// Portfolio project interface for matching
interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  projectUrl?: string;
  dateCompleted: Date;
  featured: boolean;
}

// Component for the Globe
export function Globe({ locations, findMatchingProject, onReady, isMobile, lowPerf, shouldRotate }: { locations: EnhancedLocation[], findMatchingProject: (repoName: string) => PortfolioProject | null, onReady?: () => void, isMobile: boolean, lowPerf: boolean, shouldRotate: boolean }) {
  const globeRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const [textureLoaded, setTextureLoaded] = useState(false);
  const [textureFailed, setTextureFailed] = useState(false);
  const [cloudsTextureLoaded, setCloudsTextureLoaded] = useState(false);
  const [specularTextureLoaded, setSpecularTextureLoaded] = useState(false);
  const [loadedIcons, setLoadedIcons] = useState<Record<string, THREE.Texture | null>>({});
  const [alarmColor, setAlarmColor] = useState<THREE.Color>(new THREE.Color("#FF0000")); // Start with red
  const [alarmIntensity, setAlarmIntensity] = useState<number>(1.0); // For pulsating effect
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  // const [lightsError, setLightsError] = useState<string | null>(null);
  // const isInitialMount = useRef(true);
  
  // State to track which icons are in the central view
  const [centeredIcons, setCenteredIcons] = useState<Record<number, number>>({});
  
  // State for hover effects
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);
  const [isGlobeRotating, setIsGlobeRotating] = useState<boolean>(true);
  // const [globeRotationSpeed, setGlobeRotationSpeed] = useState<number>(0.0004);
  const orbitControlsRef = useRef<any>(null);
  const iconsRef = useRef<THREE.Group[]>([]);
  const globeGroupRef = useRef<THREE.Group>(null);
  
  // Direct access to the texture loader
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  
  // Visual tuning constants
  const GLOBE_RADIUS = 2.6; // reduced from 3.0
  // Reduce geometry detail further on mobile for better FPS and lower memory
  const sphereSegments = (isMobile || lowPerf) ? 48 : 128;
  const cloudsSegments = (isMobile || lowPerf) ? 16 : 48;
  const ICON_DISTANCE = GLOBE_RADIUS + 0.4; // bring icons closer to globe
  const CLOUDS_RADIUS = GLOBE_RADIUS + 0.02; // bring clouds closer to globe
  const dayTexturePath = '/earth-blue-marble.jpg';
  const nightTexturePath = '/earth-night.jpg';
  const cityLightsPath = '/earth-city-lights.jpg';
  // const topologyPath = '/earth-topology.jpg';
  const cloudsPath = '/earth-clouds.png';
  const specularPath = '/earth-specular.jpg';

  // Separate function to load globe textures
  const loadGlobeTextures = useCallback((isDark: boolean) => {
    console.log(`Loading ${isDark ? 'dark' : 'light'} mode textures...`);
    
    if (!globeRef.current) return;
    
    // Get the material
    const material = globeRef.current.material as THREE.MeshStandardMaterial;
    
    // Reset material properties
    if (material.map) material.map.dispose();
    if (material.displacementMap) material.displacementMap.dispose();
    if (material.bumpMap) material.bumpMap.dispose();
    if (material.emissiveMap) material.emissiveMap.dispose();
    if (material.roughnessMap) material.roughnessMap.dispose();
    if (material.metalnessMap) material.metalnessMap.dispose();
    
    // Load the main texture based on theme
    textureLoader.load(
      isDark ? nightTexturePath : dayTexturePath,
      (texture) => {
        console.log(`Main texture loaded: ${isDark ? 'night' : 'day'}`);
        if (!globeRef.current) return;
        
        const material = globeRef.current.material as THREE.MeshStandardMaterial;
        // Mobile-friendly texture sampling
        texture.anisotropy = 1;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        material.map = texture;
        
        // No tint in light mode, very slight tint in dark mode
        material.color.set(isDark ? 0x222222 : 0xffffff);
        material.needsUpdate = true;
        setTextureLoaded(true);
        

        
        // Load specular map for both modes
        textureLoader.load(
          specularPath,
          (specTexture) => {
            console.log('Specular texture loaded');
            if (!globeRef.current) return;
            
            const material = globeRef.current.material as THREE.MeshStandardMaterial;
            specTexture.anisotropy = 1;
            specTexture.generateMipmaps = false;
            specTexture.minFilter = THREE.LinearFilter;
            specTexture.magFilter = THREE.LinearFilter;
            material.roughnessMap = specTexture;
            material.roughness = 0.6;
            material.metalnessMap = specTexture;
            material.metalness = 0.4;
            material.needsUpdate = true;
          }
        );
        
        // Handle emissive properties differently based on theme
        if (isDark) {
          // Dark mode gets city lights
          textureLoader.load(
            cityLightsPath,
            (lightsTexture) => {
              console.log('City lights loaded');
              if (!globeRef.current) return;
              
              const material = globeRef.current.material as THREE.MeshStandardMaterial;
              lightsTexture.anisotropy = 1;
              lightsTexture.generateMipmaps = false;
              lightsTexture.minFilter = THREE.LinearFilter;
              lightsTexture.magFilter = THREE.LinearFilter;
              material.emissiveMap = lightsTexture;
              material.emissive.set(0xffcc77);
              material.emissiveIntensity = 0.8;
              material.needsUpdate = true;
            }
          );
        } else {
          // Light mode gets a subtle glow
          if (globeRef.current) {
            const material = globeRef.current.material as THREE.MeshStandardMaterial;
            material.emissive.set(0x113355);
            material.emissiveIntensity = 0.1;
            material.needsUpdate = true;
          }
        }
      },
      undefined,
      (error) => {
        console.error('Error loading main texture:', error);
        setTextureFailed(true);
      }
    );
    
    // Load clouds texture
    if (cloudsRef.current) {
      textureLoader.load(
        cloudsPath,
        (cloudsTexture) => {
          console.log('Clouds texture loaded');
          if (!cloudsRef.current) return;
          
          const cloudMaterial = cloudsRef.current.material as THREE.MeshStandardMaterial;
          cloudsTexture.anisotropy = 1;
          cloudsTexture.generateMipmaps = false;
          cloudsTexture.minFilter = THREE.LinearFilter;
          cloudsTexture.magFilter = THREE.LinearFilter;
          cloudMaterial.map = cloudsTexture;
          cloudMaterial.transparent = true;
          cloudMaterial.opacity = isMobile ? 0.65 : 0.8;
          cloudMaterial.alphaTest = 0.1;
          cloudMaterial.blending = THREE.AdditiveBlending;
          cloudMaterial.depthWrite = false;
          cloudMaterial.needsUpdate = true;
          setCloudsTextureLoaded(true);
        }
      );
    }
  }, [textureLoader]);

  // Notify parent when globe is ready (textures and clouds loaded or textures failed but clouds loaded)
  useEffect(() => {
    if (onReady && (textureLoaded || textureFailed) && cloudsTextureLoaded) {
      onReady();
    }
  }, [onReady, textureLoaded, textureFailed, cloudsTextureLoaded]);

  // This effect runs once on mount to load the correct texture based on theme
  useEffect(() => {
    // First-time setup for correct theme
    const isDark = document.documentElement.classList.contains('dark-theme');
    setIsDarkMode(isDark);
    loadGlobeTextures(isDark);
  }, [loadGlobeTextures]);

  // Check for dark mode on mount and theme changes
  useEffect(() => {
    // Helper function to check dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark-theme');
      if (isDark !== isDarkMode) {
        console.log(`Dark mode updated: ${isDark}`);
        setIsDarkMode(isDark);
        
        // Force texture reload when theme changes
        loadGlobeTextures(isDark);
      }
    };
    
    // Check immediately on mount
    checkDarkMode();
    
    // Custom event handler for theme checking from parent component
    const handleThemeCheck = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Received theme-check event:', customEvent?.detail);
      checkDarkMode();
    };
    
    // Listen for our custom theme-check event
    document.documentElement.addEventListener('theme-check', handleThemeCheck);
    
    // Set up a MutationObserver to detect theme class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    // Observe document.documentElement for class changes
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    // Check on visibility changes (tab focus, etc.)
    document.addEventListener('visibilitychange', checkDarkMode);
    
    // Handle focus events when returning to the page
    window.addEventListener('focus', checkDarkMode);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', checkDarkMode);
      window.removeEventListener('focus', checkDarkMode);
      document.documentElement.removeEventListener('theme-check', handleThemeCheck);
      observer.disconnect();
    };
  }, [isDarkMode, loadGlobeTextures]);
  
  // Spring animation for globe rotation slowdown
  const { rotationSpeedSpring } = useSpring({
    rotationSpeedSpring: isGlobeRotating ? (lowPerf ? 0.00006 : 0.0001) : 0,
    config: { mass: 1, tension: 280, friction: 120 }
  });

  // Sync rotation with parent hint
  useEffect(() => {
    setIsGlobeRotating(shouldRotate);
  }, [shouldRotate]);
  
  // References for cloud animation
  // const cloudRotationRef = useRef<number>(0);
  // const cloudDriftXRef = useRef<number>(0);
  // const cloudDriftZRef = useRef<number>(0);
  // const cloudPulseRef = useRef<number>(0);
  // const timeOffsetRef = useRef<number>(Math.random() * 10000);
  
  // Router for navigation
  const router = useRouter();
  
  // Function to create a slug from repo name
  const createSlug = (repoName: string): string => {
    return repoName.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-'); // Replace multiple hyphens with a single one
  };
  
  // Function to handle icon click
  const handleIconClick = (location: EnhancedLocation, index: number, event: any) => {
    // Prevent event from bubbling up to other icons or the globe
    event.stopPropagation();
    
    // Debug log to confirm which icon was clicked
    console.log(`Clicked icon ${index}: ${location.repoName} at ${location.name}`);
    
    // If projectSlug provided in location data, prefer it
    const directSlug = location.projectSlug?.trim();
    // Create a slug directly from the repository name as fallback
    const repoSlug = createSlug(location.repoName);
    
    // Find the matching portfolio project for better user experience
    const matchingProject = findMatchingProject(location.repoName);
    
    if (directSlug) {
      router.push(`/portfolio/projects/${directSlug}`);
      return;
    } else if (matchingProject && matchingProject.slug) {
      console.log(`Found matching project: ${matchingProject.title} (${matchingProject.slug})`);
      console.log(`Navigating to project page with repo slug: ${repoSlug}`);
      // Navigate to the project page using the repo slug
      router.push(`/portfolio/projects/${repoSlug}`);
    } else {
      console.log(`No matching project found for ${location.repoName}`);
      // Show a confirmation before navigating to a non-existent project
      const shouldNavigate = confirm(
        `No portfolio case study found for "${location.repoName}". Would you like to view our portfolio page instead?`
      );
      
      if (shouldNavigate) {
        router.push('/portfolio');
      } else {
        // User chose not to navigate, try the project page anyway (will show 404)
        router.push(`/portfolio/projects/${repoSlug}`);
      }
    }
  };
  
  // Reset all hover states (used when clicking on empty space)
  const resetHoverStates = () => {
    if (hoveredIcon !== null) {
      setHoveredIcon(null);
      setIsGlobeRotating(true);
      document.body.style.cursor = 'auto';
    }
  };

  // Event handler for hover detection
  const handlePointerOver = (index: number, event: any) => {
    // Prevent propagation to other elements
    event.stopPropagation();
    
    // Only update if not already hovering on this icon
    if (hoveredIcon !== index) {
      setHoveredIcon(index);
      setIsGlobeRotating(false);
      document.body.style.cursor = 'pointer';
    }
  };
  
  // Event handler for hover end
  const handlePointerOut = (event: any) => {
    // Prevent propagation to other elements
    event.stopPropagation();
    
    setHoveredIcon(null);
    setIsGlobeRotating(true);
    document.body.style.cursor = 'auto';
  };
  
  // Update icon scales based on their position relative to camera
  // Compute adjusted display coordinates to avoid overlapping icons
  const displayCoords = useMemo(() => {
    if (!locations || locations.length === 0) return [] as { lat: number; lng: number; }[];
    const bucketSizeDeg = 0.6; // proximity bucket
    const groups: Record<string, number[]> = {};
    const result = locations.map(loc => ({ lat: loc.lat, lng: loc.lng }));

    const toKey = (lat: number, lng: number) => {
      const latKey = Math.round(lat / bucketSizeDeg);
      const lngKey = Math.round(lng / bucketSizeDeg);
      return `${latKey}_${lngKey}`;
    };

    locations.forEach((loc, idx) => {
      const key = toKey(loc.lat, loc.lng);
      (groups[key] ||= []).push(idx);
    });

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    Object.values(groups).forEach(indices => {
      if (indices.length <= 1) return;

      const stepDeg = Math.min(1.2, 0.28 + indices.length * 0.07); // base step radius in degrees
      indices.forEach((idx, i) => {
        const base = locations[idx];
        const angle = i * goldenAngle;
        const r = stepDeg * Math.sqrt(i + 1); // spiral out
        const cosLat = Math.max(0.1, Math.cos((base.lat * Math.PI) / 180));
        const latOffset = r * Math.cos(angle);
        const lngOffset = (r * Math.sin(angle)) / cosLat;
        let newLat = base.lat + latOffset;
        let newLng = base.lng + lngOffset;
        if (newLat > 89.9) newLat = 89.9;
        if (newLat < -89.9) newLat = -89.9;
        if (newLng > 180) newLng -= 360;
        if (newLng < -180) newLng += 360;
        result[idx] = { lat: newLat, lng: newLng };
      });
    });

    return result;
  }, [locations]);

  // Compute per-icon lift (extra distance from globe) for a balloon effect in clusters
  const iconLifts = useMemo(() => {
    if (!locations || locations.length === 0) return [] as number[];
    const bucketSizeDeg = 0.6;
    const groups: Record<string, number[]> = {};
    const toKey = (lat: number, lng: number) => {
      const latKey = Math.round(lat / bucketSizeDeg);
      const lngKey = Math.round(lng / bucketSizeDeg);
      return `${latKey}_${lngKey}`;
    };
    locations.forEach((loc, idx) => {
      const key = toKey(loc.lat, loc.lng);
      (groups[key] ||= []).push(idx);
    });

    const lifts: number[] = new Array(locations.length).fill(0);
    Object.values(groups).forEach(indices => {
      if (indices.length <= 1) return;
      // Step up like balloons; more crowded ⇒ taller stack
      const step = 0.10; // smaller lift to keep icons nearer to globe
      indices.forEach((idx, i) => {
        lifts[idx] = step * i;
      });
    });
    return lifts;
  }, [locations]);

  // Map each index to its cluster peers and stable order within the cluster
  const clusterMap = useMemo(() => {
    const map: Record<number, { peers: number[]; order: number }> = {};
    if (!locations || locations.length === 0) return map;
    const bucketSizeDeg = 0.6;
    const groups: Record<string, number[]> = {};
    const toKey = (lat: number, lng: number) => {
      const latKey = Math.round(lat / bucketSizeDeg);
      const lngKey = Math.round(lng / bucketSizeDeg);
      return `${latKey}_${lngKey}`;
    };
    locations.forEach((loc, idx) => {
      const key = toKey(loc.lat, loc.lng);
      (groups[key] ||= []).push(idx);
    });
    Object.values(groups).forEach(indices => {
      indices.forEach((idx, i) => {
        map[idx] = { peers: indices, order: i };
      });
    });
    return map;
  }, [locations]);

  useEffect(() => {
    const updateIconScales = () => {
      const newCenteredIcons: Record<number, number> = {};
      
      // For each location (using display coords), calculate its distance from the center of the globe
      locations.forEach((location, index) => {
        const display = displayCoords[index] || { lat: location.lat, lng: location.lng };
        const phi = (90 - display.lat) * (Math.PI / 180);
        const theta = (display.lng + 180) * (Math.PI / 180);
        
        // Calculate position
        // const x = -(GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta));
        const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
        // const y = GLOBE_RADIUS * Math.cos(phi);
        
        // Determine if the point is visible in the current view
        // Front of the globe is more visible (has a larger z value)
        const visibilityFactor = z + GLOBE_RADIUS; // Range roughly -R to R, higher means more visible

        // Convert to scale (0.7 to 1.2)
        const scale = 0.7 + (visibilityFactor / 6) * 0.5;
        
        newCenteredIcons[index] = Math.max(0.7, Math.min(1.2, scale));
      });
      
      setCenteredIcons(newCenteredIcons);
    };
    
    // Initial update
    updateIconScales();
    
    // Update scales at a lower frequency on mobile/low-perf
    const interval = setInterval(updateIconScales, (isMobile || lowPerf) ? 250 : 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [locations, displayCoords]);
  
  // Load icon textures for locations
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    // Allow loading cross-origin images when permitted by server
    // Support both legacy and current three.js APIs
    // @ts-ignore - some versions expose setCrossOrigin, others use the property
    textureLoader.setCrossOrigin ? textureLoader.setCrossOrigin('anonymous') : (textureLoader.crossOrigin = 'anonymous' as any);
    const newLoadedIcons: Record<string, THREE.Texture | null> = {};
    
    // Load textures for all locations with icon URLs
    locations.forEach(location => {
      if (location.iconUrl) {
        // Check if iconUrl is a URL string (starts with http or /)
        if (typeof location.iconUrl === 'string' && 
            (location.iconUrl.startsWith('http') || location.iconUrl.startsWith('/'))) {
          // Route remote URLs through our proxy to avoid CORS issues
          const isRemote = location.iconUrl.startsWith('http');
          const urlToLoad = isRemote
            ? `/api/proxy-image?url=${encodeURIComponent(location.iconUrl)}`
            : location.iconUrl;
          textureLoader.load(
            urlToLoad,
            (texture) => {
              try {
                const img = texture.image as HTMLImageElement;
                const roundedTexture = img ? createRoundedTextureFromImage(img) : texture;
                newLoadedIcons[location.repoName] = roundedTexture;
                setLoadedIcons(prev => ({ ...prev, [location.repoName]: roundedTexture }));
              } catch {
                newLoadedIcons[location.repoName] = texture;
                setLoadedIcons(prev => ({ ...prev, [location.repoName]: texture }));
              }
            },
            undefined,
            (error) => {
              try {
                const errorInfo = (error && (error as any).message) ? (error as any).message : error;
                console.error(`Error loading icon for ${location.repoName} (${location.iconUrl}):`, errorInfo);
              } catch {
                console.error(`Error loading icon for ${location.repoName} (${location.iconUrl})`);
              }
              newLoadedIcons[location.repoName] = null;
              setLoadedIcons(prev => ({ ...prev, [location.repoName]: null }));
            }
          );
        } else {
          // If it's just a string (like "W" or "C"), don't try to load it as a texture
          newLoadedIcons[location.repoName] = null;
          setLoadedIcons(prev => ({ ...prev, [location.repoName]: null }));
        }
      } else {
        newLoadedIcons[location.repoName] = null;
        setLoadedIcons(prev => ({ ...prev, [location.repoName]: null }));
      }
    });
    
    return () => {
      // Cleanup textures
      Object.values(newLoadedIcons).forEach(texture => {
        if (texture) texture.dispose();
      });
    };
  }, [locations]);

  // Slow rotation of the entire globe group with enhanced cloud animation and smooth slowdown
  useFrame(() => {
    if (globeGroupRef.current) {
      // Get current rotation speed from spring animation
      const currentSpeed = rotationSpeedSpring.get();
      
      // Rotate the globe at the current animated speed (inverted direction)
      globeGroupRef.current.rotation.y -= currentSpeed;
      
      // Add realistic counter-rotation for clouds
      if (cloudsRef.current) {
        // In reality, clouds move at a different rate than the earth's rotation
        // Earth rotates once per day, while clouds typically move at varying speeds
        // Approximate a more realistic counter-rotation with a slightly different rate
        
        // Clouds rotate in the opposite direction at a slightly slower relative speed
        // Maintain counter-rotation after inversion
        cloudsRef.current.rotation.y += currentSpeed * 0.75;
        
        // Keep uniform cloud properties instead of animating them
        const material = cloudsRef.current.material as THREE.MeshStandardMaterial;
        material.opacity = 0.8; // Fixed opacity
        material.emissiveIntensity = 0.05; // Fixed emission
      }
    }
  });
  
  // Effect to update OrbitControls autoRotate based on hover state
  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.autoRotate = isGlobeRotating;
    }
  }, [isGlobeRotating]);
  
  // Alarm blinking effect with smooth fade
  useEffect(() => {
    let fadeTimer: number;
    const redColor = new THREE.Color("#FF0000");
    const blackColor = new THREE.Color("#000000");
    let targetColor = blackColor;
    let transitionProgress = 0;
    
    // Smoother color transition using requestAnimationFrame
    const updateColor = () => {
      // Increase transition progress
      transitionProgress += 0.01;
      
      if (transitionProgress >= 1) {
        // When transition completes, switch target color
        targetColor = targetColor.equals(blackColor) ? redColor : blackColor;
        transitionProgress = 0;
      }
      
      // Create a new color that's a mix between current and target
      const newColor = new THREE.Color().copy(
        targetColor.equals(blackColor) ? redColor : blackColor
      ).lerp(targetColor, transitionProgress);
      
      setAlarmColor(newColor);
      
      // Also update intensity for pulsating effect
      setAlarmIntensity(0.7 + Math.sin(transitionProgress * Math.PI) * 0.3);
      
      fadeTimer = requestAnimationFrame(updateColor);
    };
    
    fadeTimer = requestAnimationFrame(updateColor);
    
    return () => {
      cancelAnimationFrame(fadeTimer);
    };
  }, []);
  
  // Generate a color based on location name and whether it's private
  const getLocationColor = (location: EnhancedLocation) => {
    // Generate a deterministic but varied color based on the string
    const name = location.repoName;
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Same color palette for all repos
    const colors = [
      '#007AFF', // iOS blue
      '#34C759', // iOS green
      '#FF9500', // iOS orange
      '#5AC8FA', // iOS light blue
      '#FFCC00', // iOS yellow
      '#FF2D55', // iOS pink
      '#AF52DE', // iOS purple
      '#5856D6'  // iOS indigo
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get the first letter or icon for the marker
  const getLocationIcon = (location: EnhancedLocation) => {
    // If iconUrl is a string that's not a URL, use that as the icon text
    if (typeof location.iconUrl === 'string' && 
        !(location.iconUrl.startsWith('http') || location.iconUrl.startsWith('/'))) {
      return location.iconUrl;
    }
    // Otherwise use the first letter of the repo name
    return location.repoName.charAt(0).toUpperCase();
  };

  // Create a rounded-corner texture using a canvas (adds alpha corners and optional stroke)
  const createRoundedTextureFromImage = (image: HTMLImageElement, size: number = 512, radiusRatio: number = 0.18, strokeColor: string = 'rgba(255,255,255,0.35)') => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(image);

      const r = Math.floor(size * radiusRatio);
      const w = size;
      const h = size;

      // Rounded rect path
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h);
      ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.save();
      ctx.clip();

      // Draw the image, cover the canvas
      ctx.drawImage(image, 0, 0, w, h);
      ctx.restore();

      // Light stroke for separation against dark backgrounds
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(1, Math.floor(size * 0.02));
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    } catch {
      return new THREE.CanvasTexture(image);
    }
  };
  
  // Create a rounded rectangle shape for iOS app icons
  const createRoundedRectShape = (width: number, height: number, radius: number) => {
    const shape = new THREE.Shape();
    
    // Starting at top-right corner
    shape.moveTo(width/2 - radius, -height/2);
    shape.lineTo(-width/2 + radius, -height/2);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2, -height/2 + radius);
    shape.lineTo(-width/2, height/2 - radius);
    shape.quadraticCurveTo(-width/2, height/2, -width/2 + radius, height/2);
    shape.lineTo(width/2 - radius, height/2);
    shape.quadraticCurveTo(width/2, height/2, width/2, height/2 - radius);
    shape.lineTo(width/2, -height/2 + radius);
    shape.quadraticCurveTo(width/2, -height/2, width/2 - radius, -height/2);
    
    return shape;
  };

  return (
    <>
      {/* Add a transparent layer for detecting clicks outside of icons */}
      <mesh 
        scale={[20, 20, 20]} 
        visible={false}
        onClick={resetHoverStates}
        >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      <group ref={globeGroupRef}>
        {/* Globe sphere with higher tesselation for better displacement mapping */}
        <mesh 
          ref={globeRef} 
          onClick={resetHoverStates}
        >
          <sphereGeometry args={[GLOBE_RADIUS, sphereSegments, sphereSegments]} /> 
          <meshStandardMaterial 
            color={0xffffff}  
            roughness={0.6} 
            metalness={0.4}
            envMapIntensity={1.2}
          />
        </mesh>
        
        {/* Location markers as iOS-style app icons */}
        {locations.map((location, index) => {
          // Calculate the position on the sphere for each marker
          const display = displayCoords[index] || { lat: location.lat, lng: location.lng };
          const phi = (90 - display.lat) * (Math.PI / 180);
          const theta = (display.lng + 180) * (Math.PI / 180);
          // Base (true) surface position for anchor and alarm marker
          const basePhi = (90 - location.lat) * (Math.PI / 180);
          const baseTheta = (location.lng + 180) * (Math.PI / 180);
          
          // Position slightly further from sphere surface to prevent clipping
          const lift = iconLifts[index] || 0;
          const distanceFactor = ICON_DISTANCE + lift; // lift icons further when clustered
          const x = -(distanceFactor * Math.sin(phi) * Math.cos(theta));
          const z = distanceFactor * Math.sin(phi) * Math.sin(theta);
          const y = distanceFactor * Math.cos(phi);
          
          // Calculate the position on the globe surface
          const globeSurfaceFactor = GLOBE_RADIUS;
          const surfaceX = -(globeSurfaceFactor * Math.sin(basePhi) * Math.cos(baseTheta));
          const surfaceZ = globeSurfaceFactor * Math.sin(basePhi) * Math.sin(baseTheta);
          const surfaceY = globeSurfaceFactor * Math.cos(basePhi);
          
          // Get color and icon
          const color = getLocationColor(location);
          const icon = getLocationIcon(location);
          
          // Check if this icon is hovered
          const isHovered = hoveredIcon === index;
          
          // Get the base scale factor with potential hover enhancement
          const baseScaleFactor = centeredIcons[index] || 1;
          
          // Create animated scaling when hovered
          // const { iconScale } = useSpring({
          //   iconScale: isHovered ? baseScaleFactor * 1.3 : baseScaleFactor, // Increased scale factor for more visible hover effect
          //   config: { mass: 2, tension: 170, friction: 26 }
          // });
          // Add slight extra lift for deeper peers to reduce Z-overlap from camera perspective
          const peerInfo = clusterMap[index];
          const depthLift = peerInfo ? Math.min(0.25, 0.04 * peerInfo.order) : 0;
          const iconScale = (isHovered ? baseScaleFactor * 1.3 : baseScaleFactor) * (1 - depthLift * 0.2);
          
          // Prefer friendly displayName; fallback to repoName; last resort, location name
          const displayName = location.displayName || location.repoName || location.name;
          
          // Create shape based on repo type
          // const isPrivate = location.isPrivate;
          // Use rounded rect for all repos (both public and private)
          const iconShape = createRoundedRectShape(0.15, 0.15, 0.03);
          const iconHalfSize = 0.075; // planeGeometry 0.13 ⇒ ~0.065, add margin
          
          // Check if we have a loaded icon texture for this location
          const hasCustomIcon = loadedIcons[location.repoName] !== undefined && loadedIcons[location.repoName] !== null;
          
          return (
            <group 
              key={index} 
              position={[0, 0, 0]}
              ref={el => {
                if (el) iconsRef.current[index] = el;
              }}
            >
              {/* Blinking alarm marker on the globe surface */}
              <mesh position={[surfaceX, surfaceY, surfaceZ]}>
                <sphereGeometry args={[0.02, 12, 12]} />
                <meshBasicMaterial 
                  color={alarmColor} 
                  opacity={alarmIntensity}
                  transparent
                />
              </mesh>
              
              {/* Connection line from surface marker to floating icon */}
              <line>
                <bufferGeometry attach="geometry" 
                  onUpdate={(self) => {
                    // Offset line end to the bottom of the icon to avoid visual overlap
                    const positions = new Float32Array([
                      surfaceX, surfaceY, surfaceZ,
                      x, y - iconHalfSize + 0.01, z // shorten the visible line
                    ]);
                    self.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                  }}
                />
                <lineBasicMaterial 
                  attach="material" 
                  color={alarmColor} 
                  opacity={alarmIntensity * 0.5} 
                  transparent 
                />
              </line>
              
              <group position={[x, y + (clusterMap[index]?.order ? 0.02 * clusterMap[index]!.order : 0), z]}>
                <Billboard
                  follow={true}
                  lockX={false}
                  lockY={false}
                  lockZ={false}
                >
                  {/* Scale group based on hover state (without z-position animation) */}
                  <group 
                    scale={iconScale}
                  >
                    {/* Hit detection area - larger than visual icon for easier interaction */}
                    <mesh
                      onClick={(e) => handleIconClick(location, index, e)}
                      onPointerOver={(e) => handlePointerOver(index, e)}
                      onPointerOut={handlePointerOut}
                    >
                      <circleGeometry args={[0.12, 32]} /> 
                      <meshBasicMaterial 
                        color={0x000000}
                        transparent
                        opacity={0.0} // fully transparent, does not occlude
                        depthWrite={false} // don't write to depth buffer so it won't hide objects behind it
                      />
                    </mesh>
                    
                    {/* Icon image or text label */}
                    {hasCustomIcon ? (
                      <>
                        {/* Subtle rounded plate to reveal corner radius on dark backgrounds */}
                        <mesh position={[0, 0, 0]}>
                          <shapeGeometry args={[iconShape]} />
                          <meshBasicMaterial
                            color={isDarkMode ? 0xffffff : 0x000000}
                            transparent
                            opacity={isDarkMode ? 0.14 : 0.10}
                            side={THREE.DoubleSide}
                          />
                        </mesh>
                        {/* Rounded image texture */}
                        <mesh position={[0, 0, 0.001]}>
                          <planeGeometry args={[0.13, 0.13]} />
                          <meshBasicMaterial
                            map={loadedIcons[location.repoName] as THREE.Texture}
                            transparent={true}
                            side={THREE.DoubleSide}
                          />
                        </mesh>
                      </>
                    ) : (
                      <>
                        {/* For text fallback, keep a rounded colored tile */}
                        <mesh>
                          <shapeGeometry args={[iconShape]} />
                          <meshBasicMaterial 
                            color={color} 
                            side={THREE.DoubleSide}
                          />
                        </mesh>
                        <Text
                          position={[0, 0, 0.002]}
                          fontSize={0.075}
                          color={isDarkMode ? 'white' : 'black'}
                          anchorX="center"
                          anchorY="middle"
                          renderOrder={2}
                        >
                          {icon}
                        </Text>
                      </>
                    )}
                    
                    {/* Visible project name (from location.json name) */}
                    <Text
                      position={[0, -0.13, 0.002]}
                      fontSize={0.032}
                      color={isDarkMode ? 'white' : 'black'}
                      anchorX="center"
                      anchorY="middle"
                      renderOrder={2}
                      maxWidth={0.8}
                      textAlign="center"
                    >
                      {displayName}
                    </Text>
                    
                    {/* HTML tooltip with clickable indicator - only show when hovered */}
                    {isHovered && (
                      <Html position={[0, 0.12, 0]} center>
                        <div className={styles.iconTooltip}>
                          Click to view project
                        </div>
                      </Html>
                    )}
                  </group>
                </Billboard>
              </group>
            </group>
          );
        })}
      </group>
      
      {/* Clouds layer - outside the globe group for independent movement */}
      <mesh 
        ref={cloudsRef} 
        position={[0, 0, 0]}
        onClick={resetHoverStates}
      >
        <sphereGeometry args={[CLOUDS_RADIUS, cloudsSegments, cloudsSegments]} />
        <meshStandardMaterial
          color={0xffffff}
          transparent={true}
          opacity={0.8} // Higher base opacity
          alphaTest={0.05} // Lower threshold to keep more cloud pixels visible
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.FrontSide}
          emissive={new THREE.Color("#ffffff")}
          emissiveIntensity={0.05}
        />
      </mesh>
      
      <OrbitControls 
        ref={orbitControlsRef}
        enabled={!isMobile}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.2}
        zoomSpeed={0.5}
        minDistance={5}
        maxDistance={8}
        autoRotate={isGlobeRotating}
        autoRotateSpeed={-0.08} // Even slower and inverted
      />
    </>
  );
}

// Example of how the privatereposlocation.json should look like
const privateRepoExample = `
[
  {
    "repoName": "Private-Project-Name",
    "location": "San Francisco, CA",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "iconUrl": "https://example.com/icon.png"
  }
]`;

// Example of how the location.json should look like for individual repositories
const locationExample = `
{
  "location": "New York, NY",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "iconUrl": "https://example.com/icon.png"
}`;

export default function HeroSection() {
  const [locations, setLocations] = useState<EnhancedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reposScanned, setReposScanned] = useState<number>(0);
  const [locationsFound, setLocationsFound] = useState<number>(0);
  const [privateLocationsFound, setPrivateLocationsFound] = useState<number>(0);
  const [globeOpacity, setGlobeOpacity] = useState<number>(0);
  const [globePosition, setGlobePosition] = useState<number>(-220); // Start higher by default
  const [scrollY, setScrollY] = useState<number>(0);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [contentOpacity, setContentOpacity] = useState<number>(1);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [lowPerf, setLowPerf] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(true);
  const [idleReady, setIdleReady] = useState<boolean>(false);
  const prevInViewRef = useRef<boolean>(true);
  const router = useRouter();
  const globeContainerRef = useRef<HTMLDivElement>(null);

  // Removed globe animation on portfolio navigation
 
  // Immediately check dark mode when HeroSection mounts (during navigation or initial load)
  useEffect(() => {
    // Force a check of dark mode when HeroSection is mounted
    const isDarkMode = document.documentElement.classList.contains('dark-theme');
    console.log(`HeroSection mounted, current dark mode status: ${isDarkMode}`);
    
    // Dispatch a synthetic class change event to trigger theme detection in the Globe component
    const event = new CustomEvent('theme-check', { detail: { isDarkMode } });
    document.documentElement.dispatchEvent(event);
  }, []);

  // Setup capability flags
  useEffect(() => {
    // Detect mobile and low performance
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    const updateIsMobile = () => setIsMobile(mq.matches);
    updateIsMobile();
    mq.addEventListener?.('change', updateIsMobile);

    // Heuristic for low-perf: low device memory or low hardware concurrency
    try {
      // @ts-ignore
      const devMem = (navigator as any).deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 4;
      if (devMem <= 4 || cores <= 4) setLowPerf(true);
    } catch {}

    // Respect prefers-reduced-motion
    try {
      const prm = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (prm.matches) setLowPerf(true);
    } catch {}

    // Observe visibility of globe to pause work when offscreen
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      setIsInView(entry.isIntersecting);
    }, { root: null, threshold: 0.05 });
    if (globeContainerRef.current) observer.observe(globeContainerRef.current);

    // Defer heavy work until idle or short timeout
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: any) => number);
    let idleId: number | null = null;
    if (typeof ric === 'function') {
      idleId = ric(() => setIdleReady(true), { timeout: 1200 }) as unknown as number;
    } else {
      setTimeout(() => setIdleReady(true), 900);
    }

    // Cleanup
    return () => {
      mq.removeEventListener?.('change', updateIsMobile);
      observer.disconnect();
      if (idleId && typeof (window as any).cancelIdleCallback === 'function') {
        (window as any).cancelIdleCallback(idleId);
      }
    };
  }, []);

  // Fade the globe in gracefully when re-entering the viewport
  useEffect(() => {
    const wasInView = prevInViewRef.current;
    if (!wasInView && isInView) {
      // Keep canvas content; do not reset opacity to avoid visible loading
      prevInViewRef.current = isInView;
      return;
    }
    prevInViewRef.current = isInView;
  }, [isInView]);

  // Search removed

  useEffect(() => {
    async function fetchLocations() {
      try {
        // Fetch both public and private repo locations
        let allLocations: EnhancedLocation[] = [];
        let totalReposScanned = 0;
        
        // 1. Fetch public repos from the organization
        console.log('Fetching repositories from Booleanso organization...');
        const reposResponse = await axios.get('https://api.github.com/orgs/Booleanso/repos?per_page=100');
        const repos = reposResponse.data;
        totalReposScanned += repos.length;
        
        console.log(`Found ${repos.length} public repositories to scan`);
        
        // Try to find location.json in each public repo, trying different branch names
        const publicLocationPromises = repos.map(async (repo: { name: string, clone_url?: string, html_url?: string, default_branch?: string }) => {
          console.log(`Scanning public repository: ${repo.name}, default branch: ${repo.default_branch || 'unknown'}`);
          
          // Get the default branch name or fallback to common ones
          const branchesToTry = [
            repo.default_branch, // Try the default branch first if available
            'main',
            'master',
            'development',
            'dev'
          ].filter(Boolean); // Remove any undefined values
          
          // Try each branch name until we find a location.json
          for (const branch of branchesToTry) {
            try {
              const url = `https://raw.githubusercontent.com/Booleanso/${repo.name}/${branch}/location.json`;
              console.log(`Trying to fetch: ${url}`);
              
              const locationResponse = await axios.get(url, { timeout: 5000 });
              
              if (locationResponse.status === 200 && locationResponse.data) {
                const locationData = locationResponse.data;
                
                // Verify that we have valid location data with coordinates
                if (
                  locationData.location && 
                  typeof locationData.latitude === 'number' && 
                  typeof locationData.longitude === 'number'
                ) {
                  console.log(`✅ Found valid location.json in ${repo.name} (${branch}):`, locationData);
                  
                  // Create enhanced location object
                  const enhancedLocation: EnhancedLocation = {
                    lat: locationData.latitude,
                    lng: locationData.longitude,
                    name: locationData.location,
                    repoName: repo.name,
                    iconUrl: locationData.iconUrl || undefined,
                    isPrivate: false,
                    displayName: locationData.name || undefined,
                    projectSlug: locationData.projectSlug || undefined
                  };
                  
                  return enhancedLocation;
                } else {
                  console.log(`❌ Invalid location data in ${repo.name} (${branch}):`, locationData);
                  console.log(`Required format: { "location": "City Name", "latitude": number, "longitude": number, "iconUrl": "optional-url" }`);
                }
              }
              // If we get here without returning, this branch didn't have a valid location.json
            } catch {
              // Only log 404s if in the last branch attempt
              if (branch === branchesToTry[branchesToTry.length - 1]) {
                console.log(`❌ No location.json found in ${repo.name} on any branch`);
              }
              // Don't return here, we'll try the next branch
            }
          }
          
          // If we get here, we didn't find a valid location.json in any branch
          return null;
        });
        
        // 2. Fetch private repos location data from GitHub
        console.log('Fetching private repositories location data from GitHub...');
        let privateLocations: EnhancedLocation[] = [];
        try {
          // Try to fetch privatereposlocation.json from the same organization, using different branches
          const branchesToTry = ['main', 'master', 'development', 'dev'];
          
          // Try each branch name until we find privatereposlocation.json
          for (const branch of branchesToTry) {
            try {
              const privateReposUrl = `https://raw.githubusercontent.com/Booleanso/Boolean.so/${branch}/privatereposlocation.json`;
              console.log(`Trying to fetch private repos from: ${privateReposUrl}`);
              
              const privateReposResponse = await axios.get(privateReposUrl, { timeout: 5000 });
              
              if (privateReposResponse.status === 200 && Array.isArray(privateReposResponse.data)) {
                const privateReposData = privateReposResponse.data;
                console.log(`✅ Found ${privateReposData.length} private repositories location data`);
                
                // Process each private repo location
                privateLocations = privateReposData
                  .filter((repo: PrivateRepoLocationData) => 
                    repo.repoName && 
                    repo.location && 
                    typeof repo.latitude === 'number' && 
                    typeof repo.longitude === 'number'
                  )
                  .map((repo: PrivateRepoLocationData): EnhancedLocation => ({
                    lat: repo.latitude,
                    lng: repo.longitude,
                    name: repo.location,
                    repoName: repo.repoName,
                    iconUrl: repo.iconUrl,
                    isPrivate: true,
                    displayName: repo.name,
                    projectSlug: repo.projectSlug
                  }));
                
                setPrivateLocationsFound(privateLocations.length);
                totalReposScanned += privateLocations.length;
                
                // If we found valid data, break out of the branch loop
                if (privateLocations.length > 0) {
                  console.log(`✅ Found ${privateLocations.length} private repositories with location data`);
                  break;
                }
              }
            } catch (error) {
              console.log(`❌ Could not fetch private repos from branch ${branch}:`, error);
              // Continue trying other branches
            }
          }
        } catch (error) {
          console.log('Error fetching private repositories location data:', error);
        }
        
        // 3. Fetch local private locations from the data directory
        console.log('Fetching local private repositories location data...');
        try {
          const response = await fetch('/api/private-locations');
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.locations)) {
              const localPrivateReposData = data.locations;
              console.log('✅ Found local private repositories data:', localPrivateReposData);
              
              // Create enhanced locations from local data
              const localPrivateLocations = localPrivateReposData
                .filter((repo: PrivateRepoLocationData) => 
                  repo.repoName && 
                  repo.location && 
                  typeof repo.latitude === 'number' && 
                  typeof repo.longitude === 'number'
                )
                .map((repo: PrivateRepoLocationData): EnhancedLocation => ({
                  lat: repo.latitude,
                  lng: repo.longitude,
                  name: repo.location,
                  repoName: repo.repoName,
                  iconUrl: repo.iconUrl,
                  isPrivate: true,
                  displayName: repo.name,
                  projectSlug: repo.projectSlug
                }));
              
              console.log(`✅ Added ${localPrivateLocations.length} private repositories from local data`);
              
              // Add to private locations array
              privateLocations = [...privateLocations, ...localPrivateLocations];
              setPrivateLocationsFound(privateLocations.length);
              totalReposScanned += localPrivateLocations.length;
            } else {
              console.log('❌ No valid private locations data found in the response', data);
            }
          } else {
            console.log(`❌ Error fetching private locations: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.log('Error fetching local private repositories data:', error);
        }
        
        // Process results from public repos
        const publicLocationResults = await Promise.allSettled(publicLocationPromises);
        
        // Filter out only fulfilled promises with valid locations
        const validPublicLocations = publicLocationResults
          .filter(
            (result): result is PromiseFulfilledResult<EnhancedLocation> => 
              result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value);
        
        setLocationsFound(validPublicLocations.length);
        
        // Combine public and private locations
        allLocations = [...validPublicLocations, ...privateLocations];
        setReposScanned(totalReposScanned);
        
        console.log(`Found ${validPublicLocations.length} public and ${privateLocations.length} private locations from ${totalReposScanned} total repositories`);
        
        if (allLocations.length > 0) {
          setLocations(allLocations);
        } else {
          console.log('No valid locations found in repos.');
          console.log('Sample location.json format:');
          console.log(locationExample);
          console.log('Sample privatereposlocation.json format:');
          console.log(privateRepoExample);
          
          setError('No location data found. Add location.json files to public repos or create a privatereposlocation.json file.');
          
          // Just set some placeholder locations as a fallback
          setLocations([
            { 
              lat: 40.7128, 
              lng: -74.0060, 
              name: 'New York', 
              repoName: 'Example Repo',
              isPrivate: false
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching location data:', error);
        setError('Failed to fetch location data from GitHub repositories.');
        
        // Add default location as fallback
        setLocations([
          { 
            lat: 40.7128, 
            lng: -74.0060, 
            name: 'New York', 
            repoName: 'Example Repo',
            isPrivate: false
          }
        ]);
      } finally {
        setLoading(false);
        // Add animation for globe fade-in and rise-up after loading is complete
        setTimeout(() => {
          setGlobeOpacity(1);
          setGlobePosition(0); // Move to original position
        }, 300); // Small delay for smoother transition after loading completes
      }
    }
    
    fetchLocations();
  }, []);

  // Fetch portfolio projects for mapping
  useEffect(() => {
    const fetchPortfolioProjects = async () => {
      try {
        const response = await fetch('/api/portfolio/projects');
        if (response.ok) {
          const data = await response.json();
          setPortfolioProjects(data.projects || []);
          console.log(`Loaded ${data.projects?.length || 0} portfolio projects for mapping`);
        }
      } catch (error) {
        console.error('Error fetching portfolio projects:', error);
      }
    };

    fetchPortfolioProjects();
  }, []);

  // Function to find the best matching portfolio project for a repository
  const findMatchingProject = (repoName: string) => {
    if (portfolioProjects.length === 0) {
      console.log('No portfolio projects loaded yet');
      return null;
    }

    // Try to find a project that matches the repository name
    // First, try exact title match (case insensitive)
    let match = portfolioProjects.find((project: PortfolioProject) => 
      project.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '') === 
      repoName.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '')
    );

    if (match) {
      console.log(`Found exact match for ${repoName}: ${match.title}`);
      return match;
    }

    // Try to find by keywords in the title
    const repoWords = repoName.toLowerCase().split(/[-_\s]+/).filter(word => word.length > 2);
    match = portfolioProjects.find((project: PortfolioProject) => {
      const titleWords = project.title.toLowerCase().split(/\s+/);
      return repoWords.some(repoWord => 
        titleWords.some((titleWord: string) => titleWord.includes(repoWord) || repoWord.includes(titleWord))
      );
    });

    if (match) {
      console.log(`Found keyword match for ${repoName}: ${match.title}`);
      return match;
    }

    // If no match found, return the first project as fallback
    console.log(`No specific match found for ${repoName}, using first project as fallback`);
    return portfolioProjects[0] || null;
  };

  // Configure the animation for the globe opacity and position with parallax scrolling
  const globeStyle = {
    opacity: globeOpacity,
    transform: 'translateY(0px)',
    transition: 'opacity 1.5s ease-in-out'
  };

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.content} style={{ opacity: contentOpacity, transition: 'opacity 360ms ease' }}>
          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>

        <div className={styles.backTitle} aria-hidden>
          <span className={`${styles.backTitleTop} ${styles.revealTop}`}>Build</span>
          <span className={`${styles.backTitleBottom}`} id="backTitleBottom">Anything</span>
        </div>
        <div
          ref={globeContainerRef}
          className={styles.globeContainer}
          style={{
            ...globeStyle,
            transform: 'translateY(20px)',
            transition: 'opacity 1.5s ease-in-out, transform 900ms cubic-bezier(.22,.61,.36,1)'
          }}
        >
          {loading ? (
            <div className={styles.loading}>Loading globe...</div>
          ) : (
            <Canvas
              camera={{ position: [0, 0, isMobile ? 5.0 : 5.5], fov: isMobile ? 62 : 70 }}
              dpr={[1, lowPerf ? 1.25 : 1.75]}
              gl={{ antialias: !lowPerf, powerPreference: lowPerf ? 'low-power' : 'high-performance', alpha: true, stencil: false, depth: true, preserveDrawingBuffer: true }}
            >
              <AdaptiveDpr />
              <AdaptiveEvents />
              <PerformanceMonitor onDecline={() => setLowPerf(true)} />
              {/* Main ambient light */}
              <ambientLight intensity={0.6} /> 
              
              {/* Key light (sun) */}
              <directionalLight 
                position={[5, 5, 5]} 
                intensity={1.2} 
                castShadow 
              />
              
              {/* Fill light */}
              <directionalLight 
                position={[-5, 3, 5]} 
                intensity={0.8} 
                castShadow={false}
              />
              
              {/* Rim light */}
              <directionalLight 
                position={[0, -10, -5]} 
                intensity={0.3} 
                castShadow={false}
              />
              
              <Suspense fallback={null}>
                <Globe
                  locations={locations}
                  findMatchingProject={findMatchingProject}
                  isMobile={isMobile}
                  lowPerf={lowPerf}
                  shouldRotate={true}
                  onReady={() => {
                    // Globe assets ready → fade and slide in
                    setGlobeOpacity(1);
                    if (globeContainerRef.current) {
                      requestAnimationFrame(() => {
                        globeContainerRef.current!.style.transform = 'translateY(0)';
                      });
                    }
                    // After globe settles, reveal "Anything" a bit later
                    const bottom = document.getElementById('backTitleBottom');
                    if (bottom) {
                      setTimeout(() => {
                        bottom.classList.add(styles.revealBottom);
                      }, 350); // slightly after globe starts moving
                    }
                  }}
                />
              </Suspense>
            </Canvas>
          )}
        </div>
      </div>
    </section>
  );
} 