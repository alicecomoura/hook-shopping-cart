import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      // quantidade atual
      const currentAmount = productExists ? productExists.amount : 0

      // quantidade desejada
      const amount = currentAmount +1;

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
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

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
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
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
      // TODO
    } catch {
      // TODO
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
