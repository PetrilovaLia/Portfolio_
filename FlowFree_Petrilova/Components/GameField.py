import pygame

from Components.Point import Point

#Trieda hracieho pola a logika hry
class GameField:

    #Konstruktor na vytvorenie hracieho pola
    def __init__(self,size,level):
        self.solved = None
        self.array = None
        self.size = None
        self.level = level
        self.choosemap(level)
        self.putSquareIntoArray()

    #Metoda ktora kontroluje ci je hra vyriesena 2 dolezite polia
    #pole solved : je pole v ktorom je ulozeny konecny stav pre dany level == vyherny stav
    #pole array : pole do ktoreho sa ukladaju zaciatocne body == ciele pre jednotlive farby postupne sa donho doplnaju body podla algoritmu
    def isSolved(self):
        for i in range(self.size):
            for j in range(self.size):
                if self.array[i][j] is None:
                    return False
                if not(self.array[i][j].color == self.solved[i][j].color and self.array[i][j].type == self.solved[i][j].type):
                    return False
        return True

    #prva verzia kontroly pre bt a fc iba kontroluje ci nahodou nevytvorilo stav ktory nieje podmnozinou vytazneho stavu
    def playable(self):
        for i in range(self.size):
            for j in range(self.size):
                if(self.array[i][j] is None):
                    continue
                if(self.array[i][j].color != self.solved[i][j].color):
                    return False
        return True
    #druha verzia kontroly pre bt a fc kontroluje ci v danom stave vie najst cestu od kazdej farby, rozdiel od predoslej moze najst cestu ktora nieje vo vitaznom stave
    def playable2(self, colors):
        start = None
        end = None
        counter = 0
        goal = 5
        #cyklus postupne podla farieb kontroluje ci sa daju spojit
        for color in colors:
            start = None
            end = None
            #cyklus ktory hlada zaciatocny a koncovy bod pre danu farbu
            for i in range(self.size):
                for j in range(self.size):
                    if (self.array[i][j] is None):
                        continue
                    if (self.array[i][j].color == color and self.array[i][j].type == 'square'):
                        if start is not None:
                            end = (i,j)
                        else:
                            start = (i,j)
            #do counter sa pripocitava +1 ak najde moznu cestu pre jednu farbu potom kontroluje ci nasiel cestu pre vsetky
            if self.canYouConnectColor(start, end, color, []):
                counter += 1
        if counter == goal:
            return True
        else:
            return False

    #metoda ktora kontroluje ci sa 1 farba da spojit funguje rekurzivne
    def canYouConnectColor(self, start, end, color, visited):
        #kontrola ci nasiel ciel
        if start == end:
            return True
        #kontrola ci uz nahodou nebol na tom policku
        if (start in visited):
            return False
        #kontrola aby nesiel mimo mapu
        if (start[0] < 0 or start[0] > self.size-1 or start[1] < 0 or start[1] > self.size-1):
            return False
        #kontrola ktora umoznuje metode ist iba po polickach rovnakej farby alebo policka v ktorych nieje nic = None
        if (self.array[start[0]][start[1]] is not None and not(self.array[start[0]][start[1]].color == color)):
            return False
        else:
            if start in visited:
                return False
            visited.append(start)
            #tu sa vytvaraju nove stavy a rekurzivne sa vola funkcia
            #array visited funguje na ulozenie cesty
            if self.canYouConnectColor( (int(start[0]+1), int(start[1])), end,color, visited):
                return True

            if self.canYouConnectColor( (int(start[0]-1), int(start[1])), end,color, visited):
                return True

            if self.canYouConnectColor( (int(start[0]), int(start[1])+1), end,color, visited):
                return True

            if self.canYouConnectColor( (int(start[0]), int(start[1])-1), end,color, visited):
                return True
            visited.pop(-1)
        return False
    #metoda na vykreslenie pola do pygame
    def updateScreen(self, screen):
        for i in range(self.size):
            for j in range(self.size):
                if self.array[i][j] is None:
                    None
                else:
                    screen.blit(self.array[i][j].image, (100 * i, 100 * j))
    #putpoint nepouziva sa asi iba metoda na vytvorenie policka
    def putPoint(self,color,posX,posY):
        if not (self.array[posX][posY] is None):
            return
        self.array[posX][posY] = Point(posX,posY,color,'point')

    #pridana 1 nova metoda aby som nemusel osobitne zapisovat aj do pola array tak uz len prejde a tam kde najde square v solved tak ho zapise do array
    def putSquareIntoArray(self):
        for i in range(self.size):
            for j in range(self.size):
                if self.solved[i][j] is None:
                    None
                elif self.solved[i][j].type == 'square':
                    self.array[i][j] = self.solved[i][j]

    #generator map dve polia ako som vyssie spominal solved obsahuje kazdu jednu poziciu a array iba pociatocne body
    def choosemap(self, mapID):
        if mapID == 1:
            self.size = 6
            self.array = [[None] * self.size for _ in range(self.size)]
            self.solved = [[None] * self.size for _ in range(self.size)]

            self.solved[0][0] = Point(0, 0, 'blue', 'point')
            self.solved[1][0] = Point(1, 0, 'blue', 'point')
            self.solved[2][0] = Point(2, 0, 'blue', 'square')
            self.solved[3][0] = Point(3, 0, 'brown', 'square')
            self.solved[4][0] = Point(4, 0, 'brown', 'point')
            self.solved[5][0] = Point(5, 0, 'brown', 'point')

            self.solved[0][1] = Point(0, 1, 'blue', 'point')
            self.solved[1][1] = Point(1, 1, 'pink', 'square')
            self.solved[2][1] = Point(2, 1, 'green', 'square')
            self.solved[3][1] = Point(3, 1, 'green', 'point')
            self.solved[4][1] = Point(4, 1, 'green', 'point')
            self.solved[5][1] = Point(5, 1, 'brown', 'square')

            self.solved[0][2] = Point(0, 2, 'blue', 'point')
            self.solved[1][2] = Point(1, 2, 'pink', 'point')
            self.solved[2][2] = Point(2, 2, 'pink', 'point')
            self.solved[3][2] = Point(3, 2, 'blue', 'square')
            self.solved[4][2] = Point(4, 2, 'green', 'point')
            self.solved[5][2] = Point(5, 2, 'red', 'square')

            self.solved[0][3] = Point(0, 3, 'blue', 'point')
            self.solved[1][3] = Point(1, 3, 'blue', 'point')
            self.solved[2][3] = Point(2, 3, 'pink', 'square')
            self.solved[3][3] = Point(3, 3, 'blue', 'point')
            self.solved[4][3] = Point(4, 3, 'green', 'point')
            self.solved[5][3] = Point(5, 3, 'red', 'point')

            self.solved[0][4] = Point(0, 4, 'red', 'square')
            self.solved[1][4] = Point(1, 4, 'blue', 'point')
            self.solved[2][4] = Point(2, 4, 'blue', 'point')
            self.solved[3][4] = Point(3, 4, 'blue', 'point')
            self.solved[4][4] = Point(4, 4, 'green', 'square')
            self.solved[5][4] = Point(5, 4, 'red', 'point')

            self.solved[0][5] = Point(0, 5, 'red', 'point')
            self.solved[1][5] = Point(1, 5, 'red', 'point')
            self.solved[2][5] = Point(2, 5, 'red', 'point')
            self.solved[3][5] = Point(3, 5, 'red', 'point')
            self.solved[4][5] = Point(4, 5, 'red', 'point')
            self.solved[5][5] = Point(5, 5, 'red', 'point')
        elif mapID == 2:
            self.size = 6
            self.array = [[None] * self.size for _ in range(self.size)]
            self.solved = [[None] * self.size for _ in range(self.size)]

            self.solved[0][0] = Point(0, 0, 'green', 'square')
            self.solved[1][0] = Point(1, 0, 'green', 'point')
            self.solved[2][0] = Point(2, 0, 'brown', 'square')
            self.solved[3][0] = Point(3, 0, 'brown', 'point')
            self.solved[4][0] = Point(4, 0, 'brown', 'point')
            self.solved[5][0] = Point(5, 0, 'brown', 'point')

            self.solved[0][1] = Point(0, 1, 'red', 'square')
            self.solved[1][1] = Point(1, 1, 'green', 'point')
            self.solved[2][1] = Point(2, 1, 'green', 'point')
            self.solved[3][1] = Point(3, 1, 'blue', 'square')
            self.solved[4][1] = Point(4, 1, 'blue', 'point')
            self.solved[5][1] = Point(5, 1, 'brown', 'point')

            self.solved[0][2] = Point(0, 2, 'red', 'point')
            self.solved[1][2] = Point(1, 2, 'red', 'square')
            self.solved[2][2] = Point(2, 2, 'green', 'square')
            self.solved[3][2] = Point(3, 2, 'pink', 'square')
            self.solved[4][2] = Point(4, 2, 'blue', 'point')
            self.solved[5][2] = Point(5, 2, 'brown', 'point')

            self.solved[0][3] = Point(0, 3, 'pink', 'point')
            self.solved[1][3] = Point(1, 3, 'pink', 'point')
            self.solved[2][3] = Point(2, 3, 'pink', 'point')
            self.solved[3][3] = Point(3, 3, 'pink', 'point')
            self.solved[4][3] = Point(4, 3, 'blue', 'point')
            self.solved[5][3] = Point(5, 3, 'brown', 'point')

            self.solved[0][4] = Point(0, 4, 'pink', 'point')
            self.solved[1][4] = Point(1, 4, 'blue', 'point')
            self.solved[2][4] = Point(2, 4, 'blue', 'point')
            self.solved[3][4] = Point(3, 4, 'blue', 'point')
            self.solved[4][4] = Point(4, 4, 'blue', 'point')
            self.solved[5][4] = Point(5, 4, 'brown', 'point')

            self.solved[0][5] = Point(0, 5, 'pink', 'square')
            self.solved[1][5] = Point(1, 5, 'blue', 'square')
            self.solved[2][5] = Point(2, 5, 'brown', 'square')
            self.solved[3][5] = Point(3, 5, 'brown', 'point')
            self.solved[4][5] = Point(4, 5, 'brown', 'point')
            self.solved[5][5] = Point(5, 5, 'brown', 'point')
        elif mapID == 3:
            self.size = 6
            self.array = [[None] * self.size for _ in range(self.size)]
            self.solved = [[None] * self.size for _ in range(self.size)]

            self.solved[0][0] = Point(0, 0, 'red', 'square')
            self.solved[1][0] = Point(1, 0, 'red', 'point')
            self.solved[2][0] = Point(2, 0, 'red', 'point')
            self.solved[3][0] = Point(3, 0, 'red', 'point')
            self.solved[4][0] = Point(4, 0, 'red', 'point')
            self.solved[5][0] = Point(5, 0, 'red', 'point')

            self.solved[0][1] = Point(0, 1, 'pink', 'point')
            self.solved[1][1] = Point(1, 1, 'pink', 'point')
            self.solved[2][1] = Point(2, 1, 'pink', 'point')
            self.solved[3][1] = Point(3, 1, 'pink', 'square')
            self.solved[4][1] = Point(4, 1, 'blue', 'square')
            self.solved[5][1] = Point(5, 1, 'red', 'square')

            self.solved[0][2] = Point(0, 2, 'pink', 'point')
            self.solved[1][2] = Point(1, 2, 'brown', 'point')
            self.solved[2][2] = Point(2, 2, 'brown', 'point')
            self.solved[3][2] = Point(3, 2, 'brown', 'square')
            self.solved[4][2] = Point(4, 2, 'blue', 'point')
            self.solved[5][2] = Point(5, 2, 'green', 'square')

            self.solved[0][3] = Point(0, 3, 'pink', 'point')
            self.solved[1][3] = Point(1, 3, 'brown', 'point')
            self.solved[2][3] = Point(2, 3, 'green', 'square')
            self.solved[3][3] = Point(3, 3, 'green', 'point')
            self.solved[4][3] = Point(4, 3, 'blue', 'point')
            self.solved[5][3] = Point(5, 3, 'green', 'point')

            self.solved[0][4] = Point(0, 4, 'pink', 'point')
            self.solved[1][4] = Point(1, 4, 'brown', 'square')
            self.solved[2][4] = Point(2, 4, 'pink', 'square')
            self.solved[3][4] = Point(3, 4, 'green', 'point')
            self.solved[4][4] = Point(4, 4, 'blue', 'square')
            self.solved[5][4] = Point(5, 4, 'green', 'point')

            self.solved[0][5] = Point(0, 5, 'pink', 'point')
            self.solved[1][5] = Point(1, 5, 'pink', 'point')
            self.solved[2][5] = Point(2, 5, 'pink', 'point')
            self.solved[3][5] = Point(3, 5, 'green', 'point')
            self.solved[4][5] = Point(4, 5, 'green', 'point')
            self.solved[5][5] = Point(5, 5, 'green', 'point')
        elif mapID == 4:
            self.size = 6
            self.array = [[None] * self.size for _ in range(self.size)]
            self.solved = [[None] * self.size for _ in range(self.size)]

            self.solved[0][0] = Point(0, 0, 'red', 'point')
            self.solved[1][0] = Point(1, 0, 'red', 'point')
            self.solved[2][0] = Point(2, 0, 'red', 'point')
            self.solved[3][0] = Point(3, 0, 'red', 'point')
            self.solved[4][0] = Point(4, 0, 'red', 'point')
            self.solved[5][0] = Point(5, 0, 'red', 'point')

            self.solved[0][1] = Point(0, 1, 'red', 'point')
            self.solved[1][1] = Point(1, 1, 'blue', 'square')
            self.solved[2][1] = Point(2, 1, 'pink', 'square')
            self.solved[3][1] = Point(3, 1, 'pink', 'point')
            self.solved[4][1] = Point(4, 1, 'pink', 'square')
            self.solved[5][1] = Point(5, 1, 'red', 'square')

            self.solved[0][2] = Point(0, 2, 'red', 'point')
            self.solved[1][2] = Point(1, 2, 'blue', 'point')
            self.solved[2][2] = Point(2, 2, 'blue', 'point')
            self.solved[3][2] = Point(3, 2, 'blue', 'point')
            self.solved[4][2] = Point(4, 2, 'blue', 'point')
            self.solved[5][2] = Point(5, 2, 'blue', 'square')

            self.solved[0][3] = Point(0, 3, 'red', 'point')
            self.solved[1][3] = Point(1, 3, 'red', 'point')
            self.solved[2][3] = Point(2, 3, 'red', 'point')
            self.solved[3][3] = Point(3, 3, 'red', 'point')
            self.solved[4][3] = Point(4, 3, 'red', 'square')
            self.solved[5][3] = Point(5, 3, 'green', 'square')

            self.solved[0][4] = Point(0, 4, 'green', 'square')
            self.solved[1][4] = Point(1, 4, 'brown', 'square')
            self.solved[2][4] = Point(2, 4, 'brown', 'point')
            self.solved[3][4] = Point(3, 4, 'brown', 'point')
            self.solved[4][4] = Point(4, 4, 'brown', 'square')
            self.solved[5][4] = Point(5, 4, 'green', 'point')

            self.solved[0][5] = Point(0, 5, 'green', 'point')
            self.solved[1][5] = Point(1, 5, 'green', 'point')
            self.solved[2][5] = Point(2, 5, 'green', 'point')
            self.solved[3][5] = Point(3, 5, 'green', 'point')
            self.solved[4][5] = Point(4, 5, 'green', 'point')
            self.solved[5][5] = Point(5, 5, 'green', 'point')
        elif mapID == 5:
            self.size = 6
            self.array = [[None] * self.size for _ in range(self.size)]
            self.solved = [[None] * self.size for _ in range(self.size)]

            self.solved[0][0] = Point(0, 0, 'blue', 'point')
            self.solved[1][0] = Point(1, 0, 'blue', 'point')
            self.solved[2][0] = Point(2, 0, 'blue', 'square')
            self.solved[3][0] = Point(3, 0, 'red', 'point')
            self.solved[4][0] = Point(4, 0, 'red', 'point')
            self.solved[5][0] = Point(5, 0, 'red', 'point')

            self.solved[0][1] = Point(0, 1, 'blue', 'point')
            self.solved[1][1] = Point(1, 1, 'green', 'square')
            self.solved[2][1] = Point(2, 1, 'red', 'square')
            self.solved[3][1] = Point(3, 1, 'red', 'point')
            self.solved[4][1] = Point(4, 1, 'brown', 'square')
            self.solved[5][1] = Point(5, 1, 'red', 'point')

            self.solved[0][2] = Point(0, 2, 'blue', 'square')
            self.solved[1][2] = Point(1, 2, 'green', 'point')
            self.solved[2][2] = Point(2, 2, 'green', 'point')
            self.solved[3][2] = Point(3, 2, 'green', 'point')
            self.solved[4][2] = Point(4, 2, 'brown', 'point')
            self.solved[5][2] = Point(5, 2, 'red', 'square')

            self.solved[0][3] = Point(0, 3, 'brown', 'point')
            self.solved[1][3] = Point(1, 3, 'brown', 'point')
            self.solved[2][3] = Point(2, 3, 'brown', 'point')
            self.solved[3][3] = Point(3, 3, 'green', 'point')
            self.solved[4][3] = Point(4, 3, 'brown', 'point')
            self.solved[5][3] = Point(5, 3, 'brown', 'point')

            self.solved[0][4] = Point(0, 4, 'brown', 'square')
            self.solved[1][4] = Point(1, 4, 'pink', 'square')
            self.solved[2][4] = Point(2, 4, 'brown', 'point')
            self.solved[3][4] = Point(3, 4, 'green', 'point')
            self.solved[4][4] = Point(4, 4, 'green', 'square')
            self.solved[5][4] = Point(5, 4, 'brown', 'point')

            self.solved[0][5] = Point(0, 5, 'pink', 'square')
            self.solved[1][5] = Point(1, 5, 'pink', 'point')
            self.solved[2][5] = Point(2, 5, 'brown', 'point')
            self.solved[3][5] = Point(3, 5, 'brown', 'point')
            self.solved[4][5] = Point(4, 5, 'brown', 'point')
            self.solved[5][5] = Point(5, 5, 'brown', 'point')
        elif mapID == 6:
            self.size = 6
            self.array = [[None] * self.size for _ in range(self.size)]
            self.solved = [[None] * self.size for _ in range(self.size)]

            self.solved[0][0] = Point(0, 0, 'blue', 'square')
            self.solved[1][0] = Point(1, 0, 'blue', 'point')
            self.solved[2][0] = Point(2, 0, 'red', 'square')
            self.solved[3][0] = Point(3, 0, 'red', 'point')
            self.solved[4][0] = Point(4, 0, 'red', 'point')
            self.solved[5][0] = Point(5, 0, 'red', 'point')

            self.solved[0][1] = Point(0, 1, 'brown', 'square')
            self.solved[1][1] = Point(1, 1, 'blue', 'point')
            self.solved[2][1] = Point(2, 1, 'blue', 'point')
            self.solved[3][1] = Point(3, 1, 'blue', 'point')
            self.solved[4][1] = Point(4, 1, 'green', 'square')
            self.solved[5][1] = Point(5, 1, 'red', 'point')

            self.solved[0][2] = Point(0, 2, 'brown', 'point')
            self.solved[1][2] = Point(1, 2, 'pink', 'point')
            self.solved[2][2] = Point(2, 2, 'pink', 'square')
            self.solved[3][2] = Point(3, 2, 'blue', 'square')
            self.solved[4][2] = Point(4, 2, 'green', 'point')
            self.solved[5][2] = Point(5, 2, 'red', 'point')

            self.solved[0][3] = Point(0, 3, 'brown', 'point')
            self.solved[1][3] = Point(1, 3, 'pink', 'point')
            self.solved[2][3] = Point(2, 3, 'red', 'square')
            self.solved[3][3] = Point(3, 3, 'red', 'point')
            self.solved[4][3] = Point(4, 3, 'green', 'square')
            self.solved[5][3] = Point(5, 3, 'red', 'point')

            self.solved[0][4] = Point(0, 4, 'brown', 'point')
            self.solved[1][4] = Point(1, 4, 'pink', 'point')
            self.solved[2][4] = Point(2, 4, 'pink', 'point')
            self.solved[3][4] = Point(3, 4, 'red', 'point')
            self.solved[4][4] = Point(4, 4, 'red', 'point')
            self.solved[5][4] = Point(5, 4, 'red', 'point')

            self.solved[0][5] = Point(0, 5, 'brown', 'point')
            self.solved[1][5] = Point(1, 5, 'brown', 'square')
            self.solved[2][5] = Point(2, 5, 'pink', 'point')
            self.solved[3][5] = Point(3, 5, 'pink', 'point')
            self.solved[4][5] = Point(4, 5, 'pink', 'point')
            self.solved[5][5] = Point(5, 5, 'pink', 'square')
        elif mapID == 7:
            self.size = 6
            self.array = [[None] * self.size for _ in range(self.size)]
            self.solved = [[None] * self.size for _ in range(self.size)]

            self.solved[0][0] = Point(0, 0, 'pink', 'point')
            self.solved[1][0] = Point(1, 0, 'pink', 'point')
            self.solved[2][0] = Point(2, 0, 'pink', 'point')
            self.solved[3][0] = Point(3, 0, 'pink', 'point')
            self.solved[4][0] = Point(4, 0, 'pink', 'point')
            self.solved[5][0] = Point(5, 0, 'pink', 'square')

            self.solved[0][1] = Point(0, 1, 'pink', 'point')
            self.solved[1][1] = Point(1, 1, 'green', 'square')
            self.solved[2][1] = Point(2, 1, 'green', 'point')
            self.solved[3][1] = Point(3, 1, 'green', 'point')
            self.solved[4][1] = Point(4, 1, 'green', 'point')
            self.solved[5][1] = Point(5, 1, 'brown', 'square')

            self.solved[0][2] = Point(0, 2, 'pink', 'point')
            self.solved[1][2] = Point(1, 2, 'red', 'square')
            self.solved[2][2] = Point(2, 2, 'red', 'point')
            self.solved[3][2] = Point(3, 2, 'red', 'square')
            self.solved[4][2] = Point(4, 2, 'green', 'point')
            self.solved[5][2] = Point(5, 2, 'brown', 'point')

            self.solved[0][3] = Point(0, 3, 'pink', 'point')
            self.solved[1][3] = Point(1, 3, 'green', 'point')
            self.solved[2][3] = Point(2, 3, 'green', 'point')
            self.solved[3][3] = Point(3, 3, 'green', 'point')
            self.solved[4][3] = Point(4, 3, 'green', 'point')
            self.solved[5][3] = Point(5, 3, 'brown', 'point')

            self.solved[0][4] = Point(0, 4, 'pink', 'point')
            self.solved[1][4] = Point(1, 4, 'green', 'point')
            self.solved[2][4] = Point(2, 4, 'blue', 'square')
            self.solved[3][4] = Point(3, 4, 'blue', 'point')
            self.solved[4][4] = Point(4, 4, 'blue', 'square')
            self.solved[5][4] = Point(5, 4, 'brown', 'point')

            self.solved[0][5] = Point(0, 5, 'pink', 'square')
            self.solved[1][5] = Point(1, 5, 'green', 'point')
            self.solved[2][5] = Point(2, 5, 'green', 'square')
            self.solved[3][5] = Point(3, 5, 'brown', 'square')
            self.solved[4][5] = Point(4, 5, 'brown', 'point')
            self.solved[5][5] = Point(5, 5, 'brown', 'point')
        elif mapID == 8:
            self.size = 6
            self.array = [[None] * self.size for _ in range(self.size)]
            self.solved = [[None] * self.size for _ in range(self.size)]

            self.solved[0][0] = Point(0, 0, 'green', 'square')
            self.solved[1][0] = Point(1, 0, 'pink', 'square')
            self.solved[2][0] = Point(2, 0, 'blue', 'point')
            self.solved[3][0] = Point(3, 0, 'blue', 'point')
            self.solved[4][0] = Point(4, 0, 'blue', 'point')
            self.solved[5][0] = Point(5, 0, 'blue', 'square')

            self.solved[0][1] = Point(0, 1, 'green', 'point')
            self.solved[1][1] = Point(1, 1, 'pink', 'point')
            self.solved[2][1] = Point(2, 1, 'blue', 'point')
            self.solved[3][1] = Point(3, 1, 'red', 'point')
            self.solved[4][1] = Point(4, 1, 'red', 'point')
            self.solved[5][1] = Point(5, 1, 'red', 'square')

            self.solved[0][2] = Point(0, 2, 'green', 'point')
            self.solved[1][2] = Point(1, 2, 'pink', 'point')
            self.solved[2][2] = Point(2, 2, 'blue', 'square')
            self.solved[3][2] = Point(3, 2, 'red', 'square')
            self.solved[4][2] = Point(4, 2, 'green', 'square')
            self.solved[5][2] = Point(5, 2, 'green', 'point')

            self.solved[0][3] = Point(0, 3, 'green', 'point')
            self.solved[1][3] = Point(1, 3, 'pink', 'point')
            self.solved[2][3] = Point(2, 3, 'pink', 'point')
            self.solved[3][3] = Point(3, 3, 'pink', 'point')
            self.solved[4][3] = Point(4, 3, 'pink', 'square')
            self.solved[5][3] = Point(5, 3, 'green', 'point')

            self.solved[0][4] = Point(0, 4, 'green', 'point')
            self.solved[1][4] = Point(1, 4, 'brown', 'square')
            self.solved[2][4] = Point(2, 4, 'brown', 'point')
            self.solved[3][4] = Point(3, 4, 'brown', 'point')
            self.solved[4][4] = Point(4, 4, 'brown', 'square')
            self.solved[5][4] = Point(5, 4, 'green', 'point')

            self.solved[0][5] = Point(0, 5, 'green', 'point')
            self.solved[1][5] = Point(1, 5, 'green', 'point')
            self.solved[2][5] = Point(2, 5, 'green', 'point')
            self.solved[3][5] = Point(3, 5, 'green', 'point')
            self.solved[4][5] = Point(4, 5, 'green', 'point')
            self.solved[5][5] = Point(5, 5, 'green', 'point')
        elif mapID == 9:
            self.size = 6
            self.array = [[None] * self.size for _ in range(self.size)]
            self.solved = [[None] * self.size for _ in range(self.size)]

            self.solved[0][0] = Point(0, 0, 'blue', 'square')
            self.solved[1][0] = Point(1, 0, 'blue', 'point')
            self.solved[2][0] = Point(2, 0, 'blue', 'point')
            self.solved[3][0] = Point(3, 0, 'blue', 'point')
            self.solved[4][0] = Point(4, 0, 'blue', 'point')
            self.solved[5][0] = Point(5, 0, 'red', 'square')

            self.solved[0][1] = Point(0, 1, 'brown', 'square')
            self.solved[1][1] = Point(1, 1, 'brown', 'point')
            self.solved[2][1] = Point(2, 1, 'brown', 'point')
            self.solved[3][1] = Point(3, 1, 'brown', 'point')
            self.solved[4][1] = Point(4, 1, 'blue', 'point')
            self.solved[5][1] = Point(5, 1, 'red', 'point')

            self.solved[0][2] = Point(0, 2, 'pink', 'square')
            self.solved[1][2] = Point(1, 2, 'green', 'square')
            self.solved[2][2] = Point(2, 2, 'green', 'point')
            self.solved[3][2] = Point(3, 2, 'brown', 'point')
            self.solved[4][2] = Point(4, 2, 'blue', 'point')
            self.solved[5][2] = Point(5, 2, 'red', 'point')

            self.solved[0][3] = Point(0, 3, 'pink', 'point')
            self.solved[1][3] = Point(1, 3, 'pink', 'point')
            self.solved[2][3] = Point(2, 3, 'green', 'square')
            self.solved[3][3] = Point(3, 3, 'brown', 'square')
            self.solved[4][3] = Point(4, 3, 'blue', 'point')
            self.solved[5][3] = Point(5, 3, 'red', 'point')

            self.solved[0][4] = Point(0, 4, 'red', 'square')
            self.solved[1][4] = Point(1, 4, 'pink', 'point')
            self.solved[2][4] = Point(2, 4, 'pink', 'square')
            self.solved[3][4] = Point(3, 4, 'blue', 'square')
            self.solved[4][4] = Point(4, 4, 'blue', 'point')
            self.solved[5][4] = Point(5, 4, 'red', 'point')

            self.solved[0][5] = Point(0, 5, 'red', 'point')
            self.solved[1][5] = Point(1, 5, 'red', 'point')
            self.solved[2][5] = Point(2, 5, 'red', 'point')
            self.solved[3][5] = Point(3, 5, 'red', 'point')
            self.solved[4][5] = Point(4, 5, 'red', 'point')
            self.solved[5][5] = Point(5, 5, 'red', 'point')
        elif mapID == 10:
            self.size = 6
            self.array = [[None] * self.size for _ in range(self.size)]
            self.solved = [[None] * self.size for _ in range(self.size)]

            self.solved[0][0] = Point(0, 0, 'red', 'square')
            self.solved[1][0] = Point(1, 0, 'red', 'point')
            self.solved[2][0] = Point(2, 0, 'red', 'point')
            self.solved[3][0] = Point(3, 0, 'red', 'point')
            self.solved[4][0] = Point(4, 0, 'red', 'point')
            self.solved[5][0] = Point(5, 0, 'red', 'point')

            self.solved[0][1] = Point(0, 1, 'green', 'square')
            self.solved[1][1] = Point(1, 1, 'green', 'point')
            self.solved[2][1] = Point(2, 1, 'green', 'point')
            self.solved[3][1] = Point(3, 1, 'green', 'point')
            self.solved[4][1] = Point(4, 1, 'green', 'point')
            self.solved[5][1] = Point(5, 1, 'red', 'point')

            self.solved[0][2] = Point(0, 2, 'pink', 'point')
            self.solved[1][2] = Point(1, 2, 'pink', 'point')
            self.solved[2][2] = Point(2, 2, 'pink', 'point')
            self.solved[3][2] = Point(3, 2, 'pink', 'square')
            self.solved[4][2] = Point(4, 2, 'green', 'point')
            self.solved[5][2] = Point(5, 2, 'red', 'point')

            self.solved[0][3] = Point(0, 3, 'pink', 'square')
            self.solved[1][3] = Point(1, 3, 'blue', 'point')
            self.solved[2][3] = Point(2, 3, 'blue', 'point')
            self.solved[3][3] = Point(3, 3, 'blue', 'square')
            self.solved[4][3] = Point(4, 3, 'green', 'point')
            self.solved[5][3] = Point(5, 3, 'red', 'point')

            self.solved[0][4] = Point(0, 4, 'blue', 'point')
            self.solved[1][4] = Point(1, 4, 'blue', 'point')
            self.solved[2][4] = Point(2, 4, 'brown', 'square')
            self.solved[3][4] = Point(3, 4, 'green', 'square')
            self.solved[4][4] = Point(4, 4, 'green', 'point')
            self.solved[5][4] = Point(5, 4, 'red', 'point')

            self.solved[0][5] = Point(0, 5, 'blue', 'square')
            self.solved[1][5] = Point(1, 5, 'brown', 'square')
            self.solved[2][5] = Point(2, 5, 'brown', 'point')
            self.solved[3][5] = Point(3, 5, 'red', 'square')
            self.solved[4][5] = Point(4, 5, 'red', 'point')
            self.solved[5][5] = Point(5, 5, 'red', 'point')
        #elif (mapID == 2):
        #elif (mapID == 2):
        #elif (mapID == 2):
        #elif (mapID == 2):
        #elif (mapID == 2):
        #elif (mapID == 2):






