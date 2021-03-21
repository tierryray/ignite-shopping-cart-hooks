import { Product, Stock } from '../types';
import { ReactNode, createContext, useContext, useState } from 'react';

import { api } from '../services/api';
import { toast } from 'react-toastify';

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
      const productAlreadyOnCart = cart.find(product => product.id === productId);

      if (productAlreadyOnCart) {
        updateProductAmount({ productId, amount: productAlreadyOnCart.amount });
        return;
      }

      const { data }  = await api.get(`products/${productId}`);
      const newCart = [...cart, { ...data, amount: 1}];

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);

      if (productExists) {
        const newCart = cart.filter(product => product.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw new Error();
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
      console.log(amount);

      if (amount < 1) {
        return;
      }
      
      const { data } = await api.get<UpdateProductAmount>(`stock/${productId}`);
      const amountFromStock = data.amount;

      if (amount >= amountFromStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const product = await cart.find(productFromCart => productFromCart.id === productId);
      
      if (product) {
        product.amount++;
        const updatedProduct = { ...product, amount: product.amount };
        setCart([...cart, updatedProduct]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, updatedProduct]));
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
