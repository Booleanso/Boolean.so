"use client"

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture, Billboard, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import styles from './HeroSection.module.css';
import path from 'path';
import fs from 'fs/promises';
import { useRouter } from 'next/navigation';
import { useSpring, animated } from '@react-spring/three';

// Type for location data from repositories
interface LocationData {
  location: string;
  latitude: number;
  longitude: number;
  iconUrl?: string;  // URL to an S3 icon image
}

// Type for private repository location data
interface PrivateRepoLocationData {
  repoName: string;  // Name of the private repo
  location: string;
  latitude: number;
  longitude: number;
  iconUrl?: string;
}

// Enhanced location type with repo information
interface EnhancedLocation {
  lat: number;
  lng: number;
  name: string;
  repoName: string;
  iconUrl?: string;
  isPrivate?: boolean;  // Flag to identify private repos
}

// Component for the Globe
function Globe({ locations }: { locations: EnhancedLocation[] }) {
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
  const [lightsError, setLightsError] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  
  // State to track which icons are in the central view
  const [centeredIcons, setCenteredIcons] = useState<Record<number, number>>({});
  
  // State for hover effects
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);
  const [isGlobeRotating, setIsGlobeRotating] = useState<boolean>(true);
  const [globeRotationSpeed, setGlobeRotationSpeed] = useState<number>(0.0004);
  const orbitControlsRef = useRef<any>(null);
  const iconsRef = useRef<THREE.Group[]>([]);
  const globeGroupRef = useRef<THREE.Group>(null);
  
  // Immediate dark mode check on mount and visibility change
  useEffect(() => {
    // Force check dark mode immediately on mount
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark-theme');
      if (isDark !== isDarkMode) {
        console.log(`Dark mode updated on visibility/mount: ${isDark}`);
        setIsDarkMode(isDark);
      }
    };
    
    // Check immediately
    checkDarkMode();
    
    // Check again after a short delay to ensure DOM is fully loaded
    const timeoutId = setTimeout(checkDarkMode, 100);
    
    // Listen for visibility changes (like returning to the tab or navigating back)
    document.addEventListener('visibilitychange', checkDarkMode);
    
    // Handle focus events which can occur when returning to the page
    window.addEventListener('focus', checkDarkMode);
    
    // Clean up
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', checkDarkMode);
      window.addEventListener('focus', checkDarkMode);
    };
  }, [isDarkMode]);
  
  // Check for dark mode class changes
  useEffect(() => {
    // Set up a mutation observer to detect theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkUpdated = document.documentElement.classList.contains('dark-theme');
          setIsDarkMode(isDarkUpdated);
          console.log(`Dark mode changed via class mutation: ${isDarkUpdated}`);
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  // Spring animation for globe rotation slowdown
  const { rotationSpeedSpring } = useSpring({
    rotationSpeedSpring: isGlobeRotating ? 0.0004 : 0,
    config: { mass: 1, tension: 280, friction: 120 }
  });
  
  // References for cloud animation
  const cloudRotationRef = useRef<number>(0);
  const cloudDriftXRef = useRef<number>(0);
  const cloudDriftZRef = useRef<number>(0);
  const cloudPulseRef = useRef<number>(0);
  const timeOffsetRef = useRef<number>(Math.random() * 10000);
  
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
    event.nativeEvent.stopImmediatePropagation();
    
    // Debug log to confirm which icon was clicked
    console.log(`Clicked icon ${index}: ${location.repoName} at ${location.name}`);
    
    // Navigate to the project page
    const slug = createSlug(location.repoName);
    router.push(`/projects/${slug}`);
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
    if (event.nativeEvent) {
      event.nativeEvent.stopImmediatePropagation();
    }
    
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
    if (event.nativeEvent) {
      event.nativeEvent.stopImmediatePropagation();
    }
    
    setHoveredIcon(null);
    setIsGlobeRotating(true);
    document.body.style.cursor = 'auto';
  };
  
  // Update icon scales based on their position relative to camera
  useEffect(() => {
    const updateIconScales = () => {
      const newCenteredIcons: Record<number, number> = {};
      
      // For each location, calculate its distance from the center of the globe
      locations.forEach((location, index) => {
        const phi = (90 - location.lat) * (Math.PI / 180);
        const theta = (location.lng + 180) * (Math.PI / 180);
        
        // Calculate position
        const x = -(3 * Math.sin(phi) * Math.cos(theta));
        const z = 3 * Math.sin(phi) * Math.sin(theta);
        const y = 3 * Math.cos(phi);
        
        // Determine if the point is visible in the current view
        // Front of the globe is more visible (has a larger z value)
        const visibilityFactor = z + 3; // Range roughly -3 to 3, higher means more visible

        // Convert to scale (0.7 to 1.2)
        const scale = 0.7 + (visibilityFactor / 6) * 0.5;
        
        newCenteredIcons[index] = Math.max(0.7, Math.min(1.2, scale));
      });
      
      setCenteredIcons(newCenteredIcons);
    };
    
    // Initial update
    updateIconScales();
    
    // Update scales every 100ms during rotation
    const interval = setInterval(updateIconScales, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [locations]);
  
  // Try to load a texture but use white if it fails
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    
    // Define texture paths based on theme
    const dayTexturePath = '/earth-blue-marble.jpg';
    const nightTexturePath = '/earth-night.jpg';
    const cityLightsPath = '/earth-city-lights.jpg';
    
    console.log(`Loading globe textures for ${isDarkMode ? 'dark' : 'light'} mode:`);
    console.log(`- Main texture: ${isDarkMode ? nightTexturePath : dayTexturePath}`);
    if (isDarkMode) console.log(`- City lights: ${cityLightsPath}`);
    
    // Try to load the primary earth texture based on theme
    textureLoader.load(
      isDarkMode ? nightTexturePath : dayTexturePath,
      (texture) => {
        setTextureLoaded(true);
        if (globeRef.current) {
          const material = globeRef.current.material as THREE.MeshStandardMaterial;
          material.map = texture;

          // If in dark mode, adjust the color to make the texture darker and less blue
          if (isDarkMode) {
            // Apply a dark overlay to reduce blue tint and make it darker
            material.color = new THREE.Color(0x222222); // Dark gray overlay
          } else {
            material.color = new THREE.Color(0xeeeeee); // Default light color
          }
          
          material.needsUpdate = true;
          
          // Now load the displacement/bump map for terrain elevation
          textureLoader.load(
            '/earth-topology.jpg',
            (topoTexture) => {
              if (globeRef.current) {
                const material = globeRef.current.material as THREE.MeshStandardMaterial;
                // Use as displacement map to create physical terrain elevation
                material.displacementMap = topoTexture;
                material.displacementScale = 0.15; // Increased from 0.08 for more pronounced mountains
                material.displacementBias = -0.04; // Adjust base level
                material.bumpMap = topoTexture; // Also use as bump map for finer details
                material.bumpScale = 0.05; // Increased from 0.02 for more visible detail
                material.needsUpdate = true;
              }
            },
            undefined,
            (topologyError) => {
              console.error('Error loading topology texture:', topologyError);
            }
          );
          
          // If dark mode, try to load city lights texture as emissive map
          if (isDarkMode) {
            console.log('Loading city lights texture...');
            textureLoader.load(
              cityLightsPath,
              (lightsTexture) => {
                console.log('City lights texture loaded successfully');
                if (globeRef.current) {
                  const material = globeRef.current.material as THREE.MeshStandardMaterial;
                  material.emissiveMap = lightsTexture;
                  material.emissive = new THREE.Color(0xffcc77); // Warmer amber glow for city lights
                  material.emissiveIntensity = 0.8; // Increased intensity
                  material.needsUpdate = true;
                  setLightsError(null);
                }
              },
              (progress) => {
                // Optional progress callback
                if (progress.loaded && progress.total) {
                  const percent = Math.round((progress.loaded / progress.total) * 100);
                  if (percent % 25 === 0) console.log(`City lights loading: ${percent}%`);
                }
              },
              (error: unknown) => {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Error loading city lights texture: ${errorMessage}`);
                setLightsError(`Error loading city lights texture: ${errorMessage}`);
                
                // Add fallback for city lights - just create a subtle emissive effect
                if (globeRef.current) {
                  const material = globeRef.current.material as THREE.MeshStandardMaterial;
                  material.emissive = new THREE.Color(0x555555);
                  material.emissiveIntensity = 0.2;
                  material.needsUpdate = true;
                }
              }
            );
          }
        }
      },
      undefined,
      (error) => {
        console.error('Error loading primary texture:', error);
        
        // Try fallback texture
        textureLoader.load(
          '/earth-topology.jpg',
          (fallbackTexture) => {
            setTextureLoaded(true);
            if (globeRef.current) {
              (globeRef.current.material as THREE.MeshStandardMaterial).map = fallbackTexture;
              (globeRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
            }
          },
          undefined,
          (fallbackError) => {
            console.error('Error loading fallback texture:', fallbackError);
            setTextureFailed(true);
            if (globeRef.current) {
              (globeRef.current.material as THREE.MeshStandardMaterial).color.set(0xffffff);
              (globeRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
            }
          }
        );
      }
    );
    
    return () => {
      // Cleanup
    };
  }, [isDarkMode]);

  // Try to load the clouds texture
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      '/earth-clouds.png',
      (texture) => {
        setCloudsTextureLoaded(true);
        if (cloudsRef.current) {
          // Create a proper cloud material with alpha transparency
          const cloudMaterial = cloudsRef.current.material as THREE.MeshStandardMaterial;
          cloudMaterial.map = texture;
          cloudMaterial.transparent = true;
          cloudMaterial.opacity = 0.8; // Increase opacity for more visible clouds
          cloudMaterial.alphaTest = 0.1; // Only render pixels with alpha > 0.1
          cloudMaterial.blending = THREE.AdditiveBlending; // Use additive blending for a more realistic look
          cloudMaterial.depthWrite = false; // Don't write to depth buffer (prevents z-fighting)
          cloudMaterial.needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.error('Error loading clouds texture:', error);
      }
    );
    
    return () => {
      // Cleanup
    };
  }, []);

  // Try to load the specular texture
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      '/earth-specular.jpg',
      (texture) => {
        setSpecularTextureLoaded(true);
        if (globeRef.current) {
          // Use the texture as a specular map
          const material = globeRef.current.material as THREE.MeshStandardMaterial;
          
          // In MeshStandardMaterial we use roughnessMap and metalnessMap instead of specularMap
          material.roughnessMap = texture;
          material.roughness = 0.7;  // Base roughness
          material.metalnessMap = texture;
          material.metalness = 0.3;  // Base metalness
          material.needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.error('Error loading specular texture:', error);
      }
    );
    
    return () => {
      // Cleanup
    };
  }, []);

  // Load icon textures for locations
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const newLoadedIcons: Record<string, THREE.Texture | null> = {};
    
    // Load textures for all locations with icon URLs
    locations.forEach(location => {
      if (location.iconUrl) {
        // Check if iconUrl is a URL string (starts with http or /)
        if (typeof location.iconUrl === 'string' && 
            (location.iconUrl.startsWith('http') || location.iconUrl.startsWith('/'))) {
          textureLoader.load(
            location.iconUrl,
            (texture) => {
              newLoadedIcons[location.repoName] = texture;
              setLoadedIcons(prev => ({ ...prev, [location.repoName]: texture }));
            },
            undefined,
            (error) => {
              console.error(`Error loading icon for ${location.repoName}:`, error);
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
      
      // Rotate the globe at the current animated speed
      globeGroupRef.current.rotation.y += currentSpeed;
      
      // Add realistic counter-rotation for clouds
      if (cloudsRef.current) {
        // In reality, clouds move at a different rate than the earth's rotation
        // Earth rotates once per day, while clouds typically move at varying speeds
        // Approximate a more realistic counter-rotation with a slightly different rate
        
        // Clouds rotate in the opposite direction at a slightly slower relative speed
        // This creates the impression that clouds are moving against the earth's rotation
        // but at their own natural pace
        cloudsRef.current.rotation.y -= currentSpeed * 0.75;
        
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
    let redColor = new THREE.Color("#FF0000");
    let blackColor = new THREE.Color("#000000");
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
          receiveShadow 
          castShadow
          onClick={resetHoverStates}
        >
          <sphereGeometry args={[3, 128, 128]} /> {/* Increased segments for better terrain detail */}
          <meshStandardMaterial 
            color={textureFailed ? 0xffffff : 0xeeeeee} 
            roughness={0.7} 
            metalness={0.3}
            envMapIntensity={1.0}
          />
        </mesh>
        
        {/* Location markers as iOS-style app icons */}
        {locations.map((location, index) => {
          // Calculate the position on the sphere for each marker
          const phi = (90 - location.lat) * (Math.PI / 180);
          const theta = (location.lng + 180) * (Math.PI / 180);
          
          // Position slightly further from sphere surface to prevent clipping
          const distanceFactor = 3.2;
          const x = -(distanceFactor * Math.sin(phi) * Math.cos(theta));
          const z = distanceFactor * Math.sin(phi) * Math.sin(theta);
          const y = distanceFactor * Math.cos(phi);
          
          // Calculate the position on the globe surface
          const globeSurfaceFactor = 3.0;
          const surfaceX = -(globeSurfaceFactor * Math.sin(phi) * Math.cos(theta));
          const surfaceZ = globeSurfaceFactor * Math.sin(phi) * Math.sin(theta);
          const surfaceY = globeSurfaceFactor * Math.cos(phi);
          
          // Get color and icon
          const color = getLocationColor(location);
          const icon = getLocationIcon(location);
          
          // Check if this icon is hovered
          const isHovered = hoveredIcon === index;
          
          // Get the base scale factor with potential hover enhancement
          const baseScaleFactor = centeredIcons[index] || 1;
          
          // Create animated scaling when hovered
          const { iconScale } = useSpring({
            iconScale: isHovered ? baseScaleFactor * 1.3 : baseScaleFactor, // Increased scale factor for more visible hover effect
            config: { mass: 2, tension: 170, friction: 26 }
          });
          
          // No truncation - display full name
          const displayName = location.name;
          
          // Create shape based on repo type
          const isPrivate = location.isPrivate;
          let iconShape;
          
          // Use rounded rect for all repos (both public and private)
          iconShape = createRoundedRectShape(0.15, 0.15, 0.03);
          
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
                    const positions = new Float32Array([
                      surfaceX, surfaceY, surfaceZ,
                      x, y, z
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
              
              <group position={[x, y, z]}>
                <Billboard
                  follow={true}
                  lockX={false}
                  lockY={false}
                  lockZ={false}
                >
                  {/* Animated scale group based on hover state (without z-position animation) */}
                  <animated.group 
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
                        color={0xffffff}
                        transparent
                        opacity={0.001} // Almost invisible but still captures events
                      />
                    </mesh>
                    
                    {/* Icon background shape (rounded square for all repos) */}
                    <mesh>
                      <shapeGeometry args={[iconShape]} />
                      <meshBasicMaterial 
                        color={color} 
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                    
                    {/* Icon image or text label */}
                    {hasCustomIcon ? (
                      <mesh position={[0, 0, 0.001]}>
                        <planeGeometry args={[0.13, 0.13]} />
                        <meshBasicMaterial
                          map={loadedIcons[location.repoName] as THREE.Texture}
                          transparent={true}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    ) : (
                      <Text
                        position={[0, 0, 0.002]}
                        fontSize={0.075}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        renderOrder={2}
                      >
                        {icon}
                      </Text>
                    )}
                    
                    {/* Repository label without lock icon */}
                    <Text
                      position={[0, -0.11, 0.002]}
                      fontSize={0.03}
                      color="white"
                      anchorX="center"
                      anchorY="middle"
                      renderOrder={2}
                      maxWidth={0.8}
                      textAlign="center"
                    >
                      {location.repoName.replace('.com', '')}
                    </Text>
                    
                    {/* Location name below repo name */}
                    <Text
                      position={[0, -0.16, 0.002]}
                      fontSize={0.022} 
                      color="rgba(255,255,255,0.7)"
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
                  </animated.group>
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
        <sphereGeometry args={[3.05, 48, 48]} />
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
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.2}
        zoomSpeed={0.5}
        minDistance={5}
        maxDistance={8}
        autoRotate={isGlobeRotating}
        autoRotateSpeed={0.25} // Reduced from 0.5
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
  const [globePosition, setGlobePosition] = useState<number>(100); // Start 100px lower for more dramatic rise
  const globeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLocations() {
      try {
        // Fetch both public and private repo locations
        let allLocations: EnhancedLocation[] = [];
        let totalReposScanned = 0;
        
        // 1. Fetch public repos from the organization
        console.log('Fetching repositories from WebRendHQ organization...');
        const reposResponse = await axios.get('https://api.github.com/orgs/WebRendHQ/repos?per_page=100');
        const repos = reposResponse.data;
        totalReposScanned += repos.length;
        
        console.log(`Found ${repos.length} public repositories to scan`);
        
        // Try to find location.json in each public repo, trying different branch names
        const publicLocationPromises = repos.map(async (repo: any) => {
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
              const url = `https://raw.githubusercontent.com/WebRendHQ/${repo.name}/${branch}/location.json`;
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
                    isPrivate: false
                  };
                  
                  return enhancedLocation;
                } else {
                  console.log(`❌ Invalid location data in ${repo.name} (${branch}):`, locationData);
                  console.log(`Required format: { "location": "City Name", "latitude": number, "longitude": number, "iconUrl": "optional-url" }`);
                }
              }
              // If we get here without returning, this branch didn't have a valid location.json
            } catch (error) {
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
              const privateReposUrl = `https://raw.githubusercontent.com/WebRendHQ/WebRend.com/${branch}/privatereposlocation.json`;
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
                    isPrivate: true
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
                  isPrivate: true
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

  // Configure the animation for the globe opacity and position
  const globeStyle = {
    opacity: globeOpacity,
    transform: `translateY(${globePosition}px)`,
    transition: 'opacity 1.5s ease-in-out, transform 3.5s cubic-bezier(0.19, 1, 0.22, 1)' // Slower rise-up with longer duration
  };

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.heading}>
            <h1>Build. Share. Sell. Explore a World of Code.</h1>
            <p className={styles.subtitle}>
              We build cutting-edge software — and help you profit from your GitHub projects.
            </p>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.ctas}>
            <a href="#contact" className={styles.primaryBtn}>Let's Build</a>
            <a href="/marketplace" className={styles.secondaryBtn}>Sell Your Repo</a>
          </div>
        </div>

        <div ref={globeContainerRef} className={styles.globeContainer} style={globeStyle}>
          {loading ? (
            <div className={styles.loading}>Loading globe...</div>
          ) : (
            <Canvas shadows camera={{ position: [0, 0, 5.5], fov: 70 }}>
              <ambientLight intensity={0.4} /> {/* Reduced from 0.5 for better shadows */}
              <directionalLight 
                position={[5, 5, 5]} 
                intensity={0.8} 
                castShadow 
                shadow-mapSize-width={1024} 
                shadow-mapSize-height={1024}
              />
              {/* Add a spotlight to create stronger highlights on mountains */}
              <spotLight
                position={[-5, 5, 5]}
                angle={0.5}
                penumbra={0.5}
                intensity={0.5}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              <Suspense fallback={null}>
                <Globe locations={locations} />
              </Suspense>
            </Canvas>
          )}
        </div>
      </div>
    </section>
  );
} 