'use client'
//import styles from './styles.css'; // Importar los estilos CSS
import { useState, useRef, useEffect } from 'react';
import { detectaPoses } from './modelo';
import { keypointsToNormalizedKeypoints } from '@tensorflow-models/pose-detection/dist/shared/calculators/keypoints_to_normalized_keypoints';

export default function PoseDetectionForm() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [poses, setPoses] = useState<any[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    //funciones para dibujar los puntos de la imagen
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Limpiar el canvas al cambiar las poses
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Dibujar keypoints para cada pose
                //Ya que devuelve un arreglo de poses, pese a que se delimita a máximo una pose
                poses.forEach((pose, index) => {
                    pose.keypoints.forEach((keypoint: any) => {
                        console.log(`(${keypoint.x} + " " + ${keypoint.y})`)
                        drawKeypoint(ctx, keypoint.x, keypoint.y);
                    });
                });
            }
        }
    }, [poses]);

    const drawKeypoint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI); // Dibujar un círculo en la posición (x, y)
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
    };

    //funciones para cuando se sube una iamgen al <input>
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);

            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (canvas) {
                    // Configurar el tamaño del canvas según las dimensiones de la imagen
                    canvas.width = img.width;
                    canvas.height = img.height;
                }
            };
            img.src = URL.createObjectURL(file);
        }
    };

    //función del submit, valida la imgane, de ahí la manda y obtiene el arreglo de poses
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!imageFile) return;

        try {
            const imageUrl = URL.createObjectURL(imageFile);
            const img = new Image();
            img.onload = async () => {
                const detectedPoses = await detectaPoses(img);
                setPoses(detectedPoses);
                URL.revokeObjectURL(imageUrl);
            };
            img.src = imageUrl;
        } catch (error) {
            console.error('Error al procesar la imagen:', error);
        }
    };

    return (
        <div>
            <h1>Detención de Poses</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor='img-fuente'>Imagen a escanear</label>
                <input type="file" accept="image/*" onChange={handleFileChange} name="img-fuente" id='img-fuente' />
                <button type="submit">Detectar Poses</button>
            </form>
            
            {imageFile && (
                <div style={{ position: 'relative' }}>
                    <img src={URL.createObjectURL(imageFile)} alt="Imagen" style={{ maxWidth: '100%' }} />
                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                </div>
            )}
        </div>
    );
}
