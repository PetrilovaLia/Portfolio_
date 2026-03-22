import time

import pygame
from timeit import default_timer as timer
from Components.Button import Button
from Components.GameField import GameField
from Components.Point import Point

#metoda na kopirovanie Gamefieldu pre dfs bt fc
def copyArray(array):
    copiedArray = [[None] * field.size for _ in range(field.size)]
    for i in range(field.size):
        for j in range(field.size):
            copiedArray[i][j]=array[i][j]
    return copiedArray

pygame.init()
height, width = 800, 600
screen = pygame.display.set_mode((height, width))
field = GameField(6, 1)
running = True
colorsInField = ['brown', 'blue', 'green', 'pink', 'red']

def dfs():
    print('DFS')
    start = timer()
    expandedStates = 0
    foundStates = 0
    counter = 0
    stack = []
    x = 0
    y = 0
    #hlada prve miesto kde moze byt ulozeny prvy bod
    while field.array[x][y] is not None:
        x += 1
        if (x == field.size):
            x = 0
            y += 1
        if y == field.size:
            break
    #vytvori tolko novych stavov kolko je farb na pozicii ktora sa nasla vyssie
    for color in colorsInField:
        next_state = copyArray(field.array)
        next_state[x][y] = Point(x,y,color,'point')
        stack.append((next_state,(x, y)))


    while stack:
        for event in pygame.event.get():
            k, l = pygame.mouse.get_pos()
        print('ide dfs')
        field.array, (x,y) = stack.pop()
        counter += 1
        screen.fill((0, 0, 0))
        field.updateScreen(screen)
        pygame.display.update()

        #kontrola vyhry
        if field.isSolved():
            end = timer()
            print("Solved!")
            print("-- Level: ", field.level)
            print("-- number of steps:", counter)
            print("-- solution time:", end - start, "sec")
            print("-- found states:", expandedStates)
            return False

        #halda dalsiu volnu poziciu
        while field.array[x][y] is not None:
            x += 1
            if (x == field.size):
                x = 0
                y += 1
            if y == field.size:
                break
        #vytvara novy stav zase podla farieb na najdenej pozicii tiez sa kontroluje ci nejde mimo pola
        if x < field.size and y < field.size:
            for colorr in colorsInField:
                next_state = copyArray(field.array)
                next_state[x][y] = Point(x, y, colorr, 'point')
                expandedStates += 1
                stack.append((next_state, (x, y)))

        #expandedStates += 1
        #stackPos.append((x,y))

def bt():
    #to iste ako dfs iba jedna kontrola naviac
    print('BT')
    stack = []
    start = timer()
    expandedStates = 0
    foundStates = 0
    counter = 0
    stack = []
    x = 0
    y = 0
    while field.array[x][y] is not None:

        x += 1
        if (x == field.size):
            x = 0
            y += 1
        if y == field.size:
            break
    for color in colorsInField:

        next_state = copyArray(field.array)

        next_state[x][y] = Point(x,y,color,'point')
        stack.append((next_state,(x, y)))


    while stack:
        for event in pygame.event.get():
            k, l = pygame.mouse.get_pos()

        field.array, (x,y) = stack.pop()

        counter += 1
        screen.fill((0, 0, 0))
        field.updateScreen(screen)
        pygame.display.update()

        if field.isSolved():
            end = timer()
            print("Solved!")
            print("-- Level: ", field.level)
            print("-- number of steps:", counter)
            print("-- solution time:", end - start, "sec")
            print("-- found states:", expandedStates)
            running = False
            return(False)
        #tu ej ta kontrola len kontroluje ci je playable po tom ako otvori stav
        if not (field.playable2(colorsInField)):
            continue

        while field.array[x][y] is not None:
            x += 1
            if (x == field.size):
                x = 0
                y += 1
            if y == field.size:
                break


        if x < field.size and y < field.size:
            for colorr in colorsInField:
                next_state = copyArray(field.array)
                next_state[x][y] = Point(x, y, colorr, 'point')
                expandedStates += 1
                stack.append((next_state, (x, y)))

        #expandedStates += 1
        #stackPos.append((x,y))


def fc():
    #to iste ako bt ale ta kontrola je na inom mieste
    print('FC')
    stack = []
    start = timer()
    expandedStates = 0
    foundStates = 0
    counter = 0
    stack = []
    x = 0
    y = 0
    while field.array[x][y] is not None:

        x += 1
        if (x == field.size):
            x = 0
            y += 1
        if y == field.size:
            break
    for color in colorsInField:

        next_state = copyArray(field.array)

        next_state[x][y] = Point(x,y,color,'point')
        stack.append((next_state,(x, y)))


    while stack:
        for event in pygame.event.get():
            k, l = pygame.mouse.get_pos()
        field.array, (x,y) = stack.pop()

        counter += 1

        screen.fill((0, 0, 0))
        field.updateScreen(screen)
        pygame.display.update()


        if field.isSolved():
            end = timer()
            print("Solved!")
            print("-- Level: ", field.level)
            print("-- number of steps:", counter)
            print("-- solution time:", end - start, "sec")
            print("-- found states:", expandedStates)
            return(False)
            return

        while field.array[x][y] is not None:
            x += 1
            if (x == field.size):
                x = 0
                y += 1
            if y == field.size:
                break

        if x < field.size and y < field.size:
            for colorr in colorsInField:
                next_state = copyArray(field.array)
                next_state[x][y] = Point(x, y, colorr, 'point')
                field.array = next_state
                expandedStates += 1
                #tu je ta kontrola rozdiel od bt je ten ze sa neulozi novy stav ktory nie je playable tym padom ho uz potom nema sancu otvorit
                if not (field.playable2(colorsInField)):
                    continue

                stack.append((next_state, (x, y)))

    #expandedStates += 1
    #stackPos.append((x,y))
#vytvorenie buttonov pre spustenie dfs bt fc a menenie levelov
button1 = Button("DFS", (650, 100), font=30, bg="Black")
button2 = Button("BT", (650, 175), font=30, bg="Black")
button3 = Button("FC", (650, 250), font=30, bg="Black")
button_Level = Button("Level", (650, 325), font=30, bg="Black")
level = 1

#default pygame herny cyklus
while running:
    #kontroluje vstup od puzivatela
    for event in pygame.event.get():
        x, y = pygame.mouse.get_pos()
        if event.type == pygame.QUIT:
            running = False
            pygame.quit()
        if event.type == pygame.MOUSEBUTTONDOWN:
            if pygame.mouse.get_pressed()[0]:
                if button1.rect.collidepoint(x, y):
                    #field.clear()
                    screen.fill((0, 0, 0))
                    field = GameField(5, level)
                    field.updateScreen(screen)
                    dfs()
                if button2.rect.collidepoint(x, y):
                    #field.clear()
                    screen.fill((0, 0, 0))
                    field = GameField(5, level)
                    field.updateScreen(screen)
                    bt()
                if button3.rect.collidepoint(x, y):
                    #field.clear()
                    screen.fill((0, 0, 0))
                    field = GameField(5, level)
                    field.updateScreen(screen)
                    fc()
                if button_Level.rect.collidepoint(x, y):
                    level += 1
                    if(level == 11):
                        level = 1
                    field = GameField(5, level)
                    screen.fill((0, 0, 0))
                    field.updateScreen(screen)
                    print("Level :",field.level)
                    #level = field.getLevel()
                    #level = level + 1
                    #if (level > 10):
                    #    level = 1
                    #field.setLevel(level)
                    #field.clear()
                    #screen.fill((0, 0, 0))
                    #field.makeMap(field.getLevel())
                    #field.updateScreen(screen)
    field.updateScreen(screen)
    screen.blit(button1.surface, (button1.x, button1.y))
    screen.blit(button2.surface, (button2.x, button2.y))
    screen.blit(button3.surface, (button3.x, button3.y))
    screen.blit(button_Level.surface, (button_Level.x, button_Level.y))
    pygame.display.update()

# See PyCharm help at https://www.jetbrains.com/help/pycharm/
