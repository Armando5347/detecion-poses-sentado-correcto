'use client'
import "./styles.css";// Importar los estilos CSS
import { useState, useRef, useEffect } from 'react';
import { detectaPoses } from './modelo';

export default function PoseDetectionForm() {
    //objetos auxiliares del html, para obtener la imagen y mostrar los resultados en pantalla
    const [imageFile, setImageFile] = useState<File | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const inputIzqRef = useRef<HTMLInputElement>(null);
    const inputDerRef = useRef<HTMLInputElement>(null);

    //objeto donde se almacena el resultado del modelo (la 'pose')
    const [poses, setPoses] = useState<any[]>([]);

    //los puntos del modelo a utilizar
    const puntosUsar:number[] = [5, 6, 11, 12, 13, 14];

    //un angulo de referencia/holgura en el que se determina si esta bien o mal sentado
    //no encontré información referente para suar
    const anguloReferenciaGrados:number = 25;
    /*
        Los puntos 11 y 12 son de la cadera
        5 y 6 son los hombros
        13 y 14 son de las rodillas
        {5, 11, 13} son del lado izquierdo de la persona
        {6, 12, 14} son de lado derecho de la persona
    */

    //funciones para dibujar los puntos de la imagen
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Limpiar el canvas al cambiar las poses
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.lineWidth = 5; //asignar ancho de lineas a dibujar

                //MOMENTO DE DIBUJAR
                //primero obtenemos las coorenadas de los puntos de interes
                const punto5 = obtenerCoordenadas(poses[0].keypoints[5]);
                const punto6 = obtenerCoordenadas(poses[0].keypoints[6]);
                const punto11 = obtenerCoordenadas(poses[0].keypoints[11]);
                const punto12= obtenerCoordenadas(poses[0].keypoints[12]);
                const punto13 = obtenerCoordenadas(poses[0].keypoints[13]);
                const punto14 = obtenerCoordenadas(poses[0].keypoints[14]);
                //ejes
                ctx.lineWidth = 8;
                dibujarEjes(ctx, punto11.x, punto11.y, canvas.width, canvas.height);
                dibujarEjes(ctx, punto12.x, punto12.y, canvas.width, canvas.height);

                // Dibujar puntos
                //Ya que devuelve un arreglo de poses, pese a que se delimita a máximo una pose
                poses.forEach((pose) => {
                    pose.keypoints.forEach((keypoint: any, index: number) => {
                        if(puntosUsar.includes(index)){ //si es uno de los puntos a usar
                            console.log(`${keypoint.name}:(${keypoint.x}", " ${keypoint.y})`)
                            dibujarPunto(ctx, keypoint.x, keypoint.y);
                        }
                    });
                });

                //dibujar lineas entre puntos relevantes
                ctx.lineWidth = 5;
                dibujarLinea(ctx,punto5.x,punto5.y,punto11.x,punto11.y);
                dibujarLinea(ctx,punto6.x,punto6.y,punto12.x,punto12.y);
                dibujarLinea(ctx,punto13.x,punto13.y,punto11.x,punto11.y);
                dibujarLinea(ctx,punto14.x,punto14.y,punto12.x,punto12.y);

                //dibujar angulo de referencia
                dibujarCono(ctx,punto11.x,punto11.y);
                dibujarCono(ctx,punto12.x,punto12.y);

                //finalmente, obtener angulos
                const anguloIzquierda = determinarAngulo(punto11.x, punto11.y, punto5.x, punto5.y);
                const anguloDerecha = determinarAngulo(punto12.x, punto12.y, punto6.x, punto6.y);
                //console.log(anguloIzquierda);
                //console.log(anguloDerecha);
                const inputDerecha = inputDerRef.current;
                const inputIzquierda = inputIzqRef.current;
                mostrarAngulo(inputDerecha, anguloDerecha);
                mostrarAngulo(inputIzquierda, anguloIzquierda);
                
            }
        }
        //y al final, decir si esta en el angulo o no

    }, [poses]);

    const obtenerCoordenadas = (keypoint:any): {x: number, y:number} => {
        const x = keypoint.x;
        const y = keypoint.y;
        return { x, y};
    }

    const dibujarPunto = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI); // Dibujar un círculo en la posición (x, y)
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();

    };

    const dibujarLinea = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2:number) => {
        ctx.beginPath();
        ctx.moveTo(x1,y1) //ir a la posición (x1,y1)
        ctx.lineTo(x2,y2) //dibujar una linea hasta la posición (x2,y2)
        ctx.strokeStyle = `orange`;
        ctx.stroke();
        ctx.closePath();
        
    };

    const dibujarEjes= (ctx: CanvasRenderingContext2D, x: number, y: number, width : number, height: number) => {
        ctx.strokeStyle = 'rgba(0,0,240,0.9)';
        //eje X
        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(width-1,y);
        ctx.stroke();
        ctx.closePath();
        //eje Y
        ctx.beginPath();
        ctx.moveTo(x,0);
        ctx.lineTo(x,height-1);
        ctx.stroke();
        ctx.closePath();
    };

    const dibujarCono = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        const anguloReferencia =  anguloReferenciaGrados* (Math.PI / 180); // Ángulo del cono (30° = pi/6)
        const radio = 500; // Radio del cono (ajusta según sea necesario)
        // Dibujar el cono proyectado
        ctx.beginPath();
        ctx.fillStyle = 'rgba(30, 240, 30, 0.5)'; // Este tiene que ser algo transparente para ver

        ctx.moveTo(x,y); // Establecer la punta del cono 
        // Dibujar el arco del cono
        ctx.arc(x,y, radio, 3*Math.PI/2 - anguloReferencia, 3*Math.PI/2 + anguloReferencia);
        // Cerrar el área del cono
        ctx.fill();
        ctx.closePath();
        

    };
    
    const determinarAngulo = (x1: number, y1:number, x2: number, y2:number) => {
        // Calcular el ángulo entre la línea vertical y la línea al punto a validar
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angleToVertical = Math.atan2(dy, dx); 
        //segun la documentación, se ingresa (y,x) para obtener en angulo
        //así que se obtiene en angulo con respecto al eje X
        //si intercambio la entrada para obtener el del eje Y pasan cosas raras, así que mejor así

        // Calcular la diferencia de ángulo con el ángulo del cono
        const diferencia = Math.abs(angleToVertical);
        //noventa grados menos la diferencia pasa en angulos, ya que en angulo que buscamos en el complemeto del que obtenemos
        return  Math.fround(Math.abs(90 - (diferencia*180 / Math.PI)));
    }

    const mostrarAngulo = (input: HTMLInputElement | null, angulo: number) => {
        input?.setAttribute("value",angulo.toString());
                    if(angulo > anguloReferenciaGrados){
                        input?.setAttribute("style","color : rgb(255,50,50)");
                    }else{
                        input?.setAttribute("style","color : rgb(50,255, 50)");
                    }
    }

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
        console.log("A posear");
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
        <div className="center-container">
            <h1 className="title font-bold pt-2 text-lg font-lg">Detección de Poses</h1>
            <form onSubmit={handleSubmit} className="flex w-full items-end justify-center grid lg:w-full lg:grid-cols-2 pb-2 pt-2" >
                <div className="w-full flex items-center justify-center border-gray-300 bg-gradient-to-b from-zinc-200 pb-4 pt-4 m-2  mr-2 ml-2 mt-2 mb-2 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                    <label htmlFor='img-fuente' className="mr-4">Imagen a escanear: </label>
                    <input type="file" accept="image/*" className="" onChange={handleFileChange} name="img-fuente" />
                </div>
                
                <button type="submit" className="w-full border-gray-300 bg-gradient-to-b from-zinc-200 py-4 mx-2 my-2 backdrop-blur-2xl 
                dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30
                hover:font-semibold btn">Detectar Poses</button>
            </form>
            
            {imageFile && (
                <div className="image-container">
                    <img src={URL.createObjectURL(imageFile)} alt="Imagen cargada a analizar" style={{ maxWidth: '100%' }} />
                    <canvas ref={canvasRef} className="canvas" />
                </div>
            )}
            <div className="row resultado mb-32 grid text-center lg:mb-0 lg:w-full lg:grid-cols-2 lg:text-left">
                <div className="flex items-center justify-center group w-full border-gray-300 bg-gradient-to-b from-zinc-200 pb-4 pt-4 mx-2 my-2 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border bg-gray-200 lg:dark:bg-zinc-800/30">
                    <label htmlFor="resultadoIzquierda"  className="mx-3">Angulo lado izquierdo:</label>
                    <input name="resultadoIzquierda" ref={inputIzqRef} type="number" className="mx-2 rounded bg-gray-100 dark:bg-zinc-400/30 text-center" readOnly/>
                </div>
                <div className="flex items-center justify-center group w-full border-gray-300 bg-gradient-to-b from-zinc-200 pb-4 pt-4 mx-2 my-2 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:dark:bg-zinc-800/30">
                    <label htmlFor="resultadoDerecha" className="mx-3">Angulo lado derecho:</label>
                    <input name="resultadoDerecha" ref={inputDerRef} type="number" className="mx-2 rounded bg-gray-100 dark:bg-zinc-400/30 text-center" readOnly/>
                </div>
                
            </div>
        </div>
    );
}

