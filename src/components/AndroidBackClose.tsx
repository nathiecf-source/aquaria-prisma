import { useEffect, useRef } from "react";
import { pushAndroidBackHandler } from "../lib/androidBack";

interface AndroidBackCloseProps {
  when: boolean;
  onClose: () => void;
}

/**
 * Liga um overlay ao botão Voltar do Android: enquanto `when` for true,
 * o handler fica no topo da pilha e o Voltar chama `onClose`.
 * Renderiza null — usar ao lado do modal/drawer correspondente.
 */
export const AndroidBackClose: React.FC<AndroidBackCloseProps> = ({ when, onClose }) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!when) return;
    return pushAndroidBackHandler(() => onCloseRef.current());
  }, [when]);

  return null;
};
