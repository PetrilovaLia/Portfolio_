import pygame


class Button:


    #Iba button v pygame
    def __init__(self, text, pos, font, bg):
        self.x, self.y = pos
        self.text = text
        self.font = pygame.font.SysFont("Book Antiqa", font)
        self.text = self.font.render(text, 1, pygame.Color("White"))
        self.size = self.text.get_size()
        self.surface = pygame.Surface(self.size)
        self.surface.fill(bg)
        self.surface.blit(self.text, (0, 0))
        self.rect = pygame.Rect(self.x, self.y, self.size[0], self.size[1])