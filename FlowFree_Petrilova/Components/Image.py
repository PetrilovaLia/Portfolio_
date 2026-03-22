import pygame

class Image:
    #dedenie nemuselo by lebo som to chcel robit inac ale ked uz to je tak aspon mas nieco naviac :D
    def __init__(self, color, type):
        self.color = color
        self.type = type
        self.image = self.loadImage()

    def loadImage(self):
        return pygame.image.load('img/' + self.color + self.type + '.png')
