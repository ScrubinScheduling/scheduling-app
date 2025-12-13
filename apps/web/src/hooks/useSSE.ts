'use client'

import {useEffect, useRef} from 'react';

type Handlers = Record<string, (payload: unknown) => void>

export function useSSEStream(workspaceId: number | null, handlers: Handlers) {
    const handlerRef = useRef(handlers);

    useEffect(() => {
        handlerRef.current = handlers;
    }, [handlers])

    useEffect(() => {
        const url =  workspaceId != null ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/stream?workspaceId=${workspaceId}` :
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/stream`;

        const source = new EventSource(url, {withCredentials: true}); 

        const handleMessage =  (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data);
                handlerRef.current[msg.type]?.(msg.payload);
            } catch (err) {
                console.log('SSE Error', err);
            }
        }

        source.addEventListener('message', handleMessage);

        source.onerror = (err) => {
            console.log('SSE Error', err);
        }

        return () => {
            source.removeEventListener('message', handleMessage)
            source.close(); 
        }
    }, [workspaceId]); 
}