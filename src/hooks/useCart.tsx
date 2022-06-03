import { createContext, ReactNode, useContext, useRef, useState } from 'react';
import { useEffect } from 'react-router/node_modules/@types/react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>();

  // toda vez que aplicação for renderizada o current vai receber do cart provider
  useEffect(() => {
    prevCartRef.current = cart;
  })

  // se ele existir, pois pode ser um product ou undefined
  // como ele começa undefined, a aplicação atualizaria toda vez,
  // para que isso não aconteça, usa-se o ??.

  // ou seja, se o valor da esquerda for false, null ou undefined
  // ele atribui o valor da direita (nesse caso, na primeira passada)

  // na segunda passa, o valor da esquerda nao é mais falso ou undefined
  // e dessa forma pode-se usar a condição

  const cartPreviousValue = prevCartRef.current ?? cart

  useEffect(() => {
    // se cartPreviousValue for diferente de cart significa que teve uma alteração no carrinho
    // e assim o useEffect atualiza o estado
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, cartPreviousValue])

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      // quantidade atual
      const currentAmount = productExists ? productExists.amount : 0;

      // quantidade desejada
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      // se o produto existe de fato, deve atualizar a quantidade de produto
      if (productExists) {
        productExists.amount = amount;
      } 
      // se for um produto novo, busque na api 
      else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        updatedCart.push(newProduct);
      }
      setCart(updatedCart);
    } catch {
      toast.error('Erro na adição de produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];

      // para a remoção do produto precisa verificar se existe no carrinho do
      // é preciso utiliza o findIndex para mais tarde poder usar o splice para 
      // pode remover do array
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      // se o findIndex não encontra retorna -1 
      // se ele encontrou significa que o productIndex é maior ou igual a 0
      if (productIndex >= 0) {
        // começa a apagar do index que encontro, no caso o productIndex e apaga 1 produto
        // mantendo o princio de imutabilidade <3
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
      } else {
        //força o erro pra cair no catch
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return; 
      }

      // verificação do stock
      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      // verificar se a quantidade desejada é maior do que tem no estoque
      // e cancelar e execução da função
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];

      const productExists = updatedCart.find(product => product.id === productId);

      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
