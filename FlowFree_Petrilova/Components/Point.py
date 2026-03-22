import pygame

from Components.Image import Image

#class ktory dedi od image, tato classa sluzi na ukladanie stvorcov(pociatocny stav) a kruzkov do pola(cesta ktora spaja pociatocne stavy)
class Point(Image):
    def __init__(self,posx,posy,color,type):
        super().__init__(color, type)
        self.posx = posx
        self.posy = posy
