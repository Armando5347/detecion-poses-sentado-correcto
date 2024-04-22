import { unstable_noStore as noStore } from 'next/cache';
import * as posedetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import { Noto_Sans_Anatolian_Hieroglyphs } from 'next/font/google';


export async function detectaPoses(image: HTMLImageElement): Promise<any[]> {
    try {
        //llamar noStore para que siempre elimine la información y se tenga que obtener de nuevo
        noStore()
        // Esperar a que TensorFlow.js esté listo
        await tf.ready(); 

        // Cargar el modelo de detección de poses (en este caso, PoseNet)
        const model = posedetection.SupportedModels.PoseNet
        //se ingresa el modelo y su configuración, he de admitir que no se bien lo que hace la mayoría de campos
        const detector = await posedetection.createDetector(model , {
            quantBytes: 4,
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: {width: 500, height: 500},
            multiplier: 0.75
          });

        // Establecer las opciones de detección
        const detectorOptions = {
            maxPoses: 1, // Detectar solo una pose
            scoreThreshold: 0.5 // Umbral de confianza para la detección de poses
        };

        // Detectar poses en la imagen cargada
        const poses = await detector.estimatePoses(image, detectorOptions);

        return poses;
    } catch (error) {
        console.error('Error al procesar la imagen:', error);
        return [];
    }
}
