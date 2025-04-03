import { IconType } from 'react-icons';
import {
  GiPanda,
  GiTigerHead,
  GiRabbit,
  GiLion,
  GiCat,
  GiSittingDog
} from 'react-icons/gi';

type AnimalKey = '熊猫' | '老虎' | '兔子' | '狮子' | '猫咪' | '小狗';

export const animalIcons: Record<AnimalKey, IconType> = {
  '熊猫': GiPanda,
  '老虎': GiTigerHead,
  '兔子': GiRabbit,
  '狮子': GiLion,
  '猫咪': GiCat,
  '小狗': GiSittingDog
};

export const getAnimalFromUsername = (username: string): AnimalKey => {
  return ((['熊猫', '老虎', '兔子', '狮子', '猫咪', '小狗'] as const).find(
    animal => username.includes(animal)
  ) || '熊猫') as AnimalKey;
}; 