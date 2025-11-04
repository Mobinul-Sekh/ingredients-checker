import { CameraView, Camera } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, View, PanResponder, Dimensions, TouchableOpacity, Image } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import ThreeDotLoader from '@/components/svgs/ThreeDotLoader';
import { BACKEND_URL } from '../../constants/ENVs';
import { useNavigation, StackActions } from '@react-navigation/native';
import LoadingScreen from '../loading';
import * as FileSystem from 'expo-file-system/legacy';
import { safeParseJSON } from '@/utils/jsonParser';

export default function ScanScreen() {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const [permission, requestPermission] = useState({ granted: false });
  const [mediaLibraryPermission, requestMediaLibraryPermission] = useState({ granted: false });
  const [capturedImage, setCapturedImage] = useState<ImageManipulator.ImageResult | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [cameraLayout, setCameraLayout] = useState({ width: screenWidth, height: screenHeight });
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const [frameSize, setFrameSize] = useState({
    width: 200,
    height: 200,
  });
  const [framePosition, setFramePosition] = useState({
    x: (screenWidth - 200) / 2,
    y: (screenHeight - 200) / 2,
  });

  const cameraRef = useRef<Camera | null>(null);

  // Pan responder for resizing
  const resizePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // No need to save initial position as we'll use gestureState.dx and dy
    },
    onPanResponderMove: (_, gestureState) => {
      // Update frame size based on gesture movement
      setFrameSize({
        width: Math.max(50, frameSize.width + gestureState.dx),
        height: Math.max(50, frameSize.height + gestureState.dy),
      });
    },
  });

  // Pan responder for moving the frame
  const movePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      setFramePosition({
        x: Math.max(0, Math.min(screenWidth - frameSize.width, framePosition.x + gestureState.dx)),
        y: Math.max(0, Math.min(screenHeight - frameSize.height, framePosition.y + gestureState.dy)),
      });
    },
  });

  const checkPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    requestPermission(cameraPermission);
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  /**
   * Captures a photo using the camera when it's available and not processing a photo.
   * The photo is then cropped based on the frame's position and size, considering
   * layout-to-photo aspect ratio differences. The cropped image is stored for further use.
   * 
   * Steps:
   * 1. Ensures the camera is ready and not currently processing another photo.
   * 2. Captures a photo with quality set to maximum.
   * 3. Compares layout and photo aspect ratios to determine any overflow.
   * 4. Calculates crop parameters based on the frame position and size.
   * 5. Crops the captured photo to the specified frame and stores it.
   * 
   * Handles any errors during the process and ensures the `processingPhoto` state
   * is reset after attempting to take a photo.
   */
  const takePicture = async () => {
    if (cameraRef.current && !processingPhoto) {
      setProcessingPhoto(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 1 });

        const layoutAspectRatio = cameraLayout.width / cameraLayout.height;
        const photoAspectRatio = photo.width / photo.height;

        let offsetX = 0;
        let adjustedWidthRatio = photo.width / cameraLayout.width;

        // Check if the photo is wider than the preview
        if (photoAspectRatio > layoutAspectRatio) {
          // Real image is wider — we need to calculate the invisible overflow on the sides
          const visibleWidth = photo.height * layoutAspectRatio; // width visible in preview
          const excessWidth = photo.width - visibleWidth;
          offsetX = excessWidth / 2;

          adjustedWidthRatio = visibleWidth / cameraLayout.width;
        }


        // Calculate crop parameters
        // We need to account for possible aspect ratio differences between
        // the view and the actual camera image
        // const widthRatio = photo.width / cameraLayout.width;
        const heightRatio = photo.height / cameraLayout.height;

        const cropRegion = {
          originX: offsetX + framePosition.x * adjustedWidthRatio,
          originY: framePosition.y * heightRatio,
          width: frameSize.width * adjustedWidthRatio,
          height: frameSize.height * heightRatio,
        };

        // Crop the image to the frame area
        const manipResult = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              crop: cropRegion
            }
          ],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );

        setCapturedImage(manipResult);
      } catch (error) {
        console.error("Error taking picture:", error);
      } finally {
        setProcessingPhoto(false);
      }
    }
  };

  // TODO: will think later whether to add this feature or not
  const saveImage = async () => {
    if (capturedImage && mediaLibraryPermission.granted) {
      try {
        const asset = await MediaLibrary.createAssetAsync(capturedImage.uri);
        await MediaLibrary.createAlbumAsync("CameraApp", asset, false);
        alert("Image saved to gallery!");
        setCapturedImage(null); // Reset to continue taking photos
      } catch (error) {
        console.error("Error saving image:", error);
        alert("Failed to save image");
      }
    } else if (!mediaLibraryPermission.granted) {
      alert("Media library permission is required to save images");
      requestMediaLibraryPermission(mediaLibraryPermission);
    }
  };

  const postAnalysisRequest = async (image: string) => {
    setLoading(true);
    const imageBase64 = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });
    try {
      console.log("Calling analysis API...");
      const response = await fetch(`${BACKEND_URL}/analyze-ingredients-affects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageBase64 }),
      });
      const responseData = await response.json();

      if (responseData.success) {
        listenForAnalysisReport(responseData.task_id);
      }
    } catch (error) {
      setLoading(false);
      console.error("Error calling OCR API:", error);
    }
  }

  const listenForAnalysisReport = async (currentAnalysisId: string) => {
    const intervalId = setInterval(async () => {
      try {
        console.log("Current analysis ID:", currentAnalysisId);
        const response = await fetch(`${BACKEND_URL}/get-analysis-result/${currentAnalysisId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        const responseJson = await response.json();

        if (responseJson.status === 'completed') {
          clearInterval(intervalId);
          setLoading(false);
          const parsedResult = safeParseJSON(responseJson.result);
          if (parsedResult === "[]") {
            alert("No ingredients found!");
          } else {
            if (typeof parsedResult === "string") {
              navigation.dispatch(StackActions.push('ingredient', { ingredients: JSON.parse(parsedResult) }));
            } else {
              navigation.dispatch(StackActions.push('ingredient', { ingredients: parsedResult }));
            }
          }
        } else if (responseJson.status === 'failed') {
          setLoading(false);
          console.error('Analysis failed:', responseJson);
          alert("Analysis failed! Try again.");
          clearInterval(intervalId);
        }
      } catch (error) {
        setLoading(false);
        navigation.dispatch(StackActions.push('error', { error: error }));
        console.error("Error while fetching results:", error);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }

  const retakePicture = () => {
    setCapturedImage(null);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={checkPermissions} title="Grant permissions" />
      </View>
    );
  }

  if (capturedImage) {
    return (
      loading ? <LoadingScreen /> :
        <View style={styles.container}>
          <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={retakePicture}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={() => postAnalysisRequest(capturedImage.uri)}>
              <Text style={styles.buttonText}>Analyze</Text>
            </TouchableOpacity>
          </View>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        ref={cameraRef}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setCameraLayout({ width, height });
        }}
      >
        {/* Top overlay */}
        <View
          style={[
            styles.overlay,
            {
              top: 0,
              left: 0,
              right: 0,
              height: framePosition.y
            }
          ]}
        />

        {/* Left overlay */}
        <View
          style={[
            styles.overlay,
            {
              top: framePosition.y,
              left: 0,
              width: framePosition.x,
              height: frameSize.height
            }
          ]}
        />

        {/* Right overlay */}
        <View
          style={[
            styles.overlay,
            {
              top: framePosition.y,
              left: framePosition.x + frameSize.width,
              right: 0,
              height: frameSize.height
            }
          ]}
        />

        {/* Bottom overlay */}
        <View
          style={[
            styles.overlay,
            {
              top: framePosition.y + frameSize.height,
              left: 0,
              right: 0,
              bottom: 0
            }
          ]}
        />

        {/* Resizable frame */}
        <View
          {...movePanResponder.panHandlers}
          style={[
            styles.frame,
            {
              width: frameSize.width,
              height: frameSize.height,
              left: framePosition.x,
              top: framePosition.y,
            },
          ]}
        >
          {/* Resize handle in bottom right corner */}
          <View
            style={styles.resizeHandle}
            {...resizePanResponder.panHandlers}
          />
        </View>

        {/* Capture button */}
        <View style={styles.captureButtonContainer}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            disabled={processingPhoto}
          >
            {processingPhoto ? (<ThreeDotLoader />) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  frame: {
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
    zIndex: 2,
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black overlay
    zIndex: 1,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: -15,
    right: -15,
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    zIndex: 3,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    zIndex: 3,
  },
  captureButton: {
    display: 'flex',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  captureButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  previewImage: {
    flex: 1,
    height: '100%',
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'black',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#333',
    width: '45%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});