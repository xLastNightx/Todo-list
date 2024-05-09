(function() {
  // создаем и возвращаем заголовок приложения
  function createAppTitle(title) {
    const appTitle = document.createElement('h2'); //создаем элемент
    appTitle.innerHTML = title; // присваиваем значение, все спецсимволы могут превратиться в теги
    return appTitle;
  }

  // создаем и возвращаем форму для создания дела
  function createTodoItemForm() {
    let form = document.createElement('form');
    let input = document.createElement('input');
    let buttonWrapper = document.createElement('div');
    let button = document.createElement('button');

    form.classList.add('input-group', 'mb-3'); // добавляем классы
    input.classList.add('form-control');
    input.placeholder = 'Ввведите название нового дела'; // заполняем placeholder
    buttonWrapper.classList.add('input-group-append');
    button.classList.add('btn', 'btn-primary');
    button.textContent = 'Добавить дело';
    button.disabled = true;

    buttonWrapper.append(button); // заносим элементы друг в друга
    form.append(input);
    form.append(buttonWrapper);

    input.addEventListener('input', function() { // реагирует на ввод
      if(input.value !== "") {
        button.disabled = false
      } else {
        button.disabled = true
      }
    })

    return { // возвращаем не только form, ибо по нажатию на кнопку мы должны забрать инфу из input, если не вернем, то не будем иметь к ним доступа
      form,
      input,
      button
    };
  }


  // создаем и возвращаем список элементов
  function createTodoList() {
    let list = document.createElement('ul');
    list.classList.add('list-group');
    return list;
  }

  function createTodoItemElement(todoItem, {onDone, onDelete}) {
    const doneClass = 'list-group-item-success';

    let item = document.createElement('li');
    // кнопки помещаем в элемент, который красиво покажет их в одной группе
    let buttonGroup = document.createElement('div');
    let doneButton = document.createElement('button');
    let deleteButton = document.createElement('button');

    // устанавливаем стили для элемента списка, а также для размещения кнопок
    // в его правой части с помощью flex
    item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
    item.textContent = todoItem.name; // именно textContent, а не innerHTML, ибо там могут быть спецсимволы, а на не надо, чтобы они превращались в теги

    buttonGroup.classList.add('btn-group', 'btn-group-sm');
    doneButton.classList.add('btn', 'btn-success') // !!!!!!!! непонятно с ;
    doneButton.textContent = 'Готово';
    deleteButton.classList.add('btn', 'btn-danger')
    deleteButton.textContent = 'Удалить';

    if(todoItem.done == true) item.classList.add(doneClass);

    // добавляем обработчики на кнопки
    doneButton.addEventListener('click', function() {
      onDone({todoItem, element: item});
      item.classList.toggle(doneClass, todoItem.done); // еще добавили 2 параметр, ибо он toggle
    });
    deleteButton.addEventListener('click', function() {
      onDelete({todoItem, element: item});
    });

    // вкладываем кнопки в отдельный элемент, чтобы они объединились в один блок
    buttonGroup.append(doneButton);
    buttonGroup.append(deleteButton);
    item.append(buttonGroup);

    // приложению нужен доступ к самому элементу и кнопкам, чтобы обрабатывать события нажатия
    return item;
  }

  async function createTodoApp(container, title, owner) { // в аргументы вынесли то, что может меняться в зависимости от списка
    const todoAppTitle = createAppTitle(title); // передаем значение функции и даем значение
    const todoItemForm = createTodoItemForm();
    const todoList = createTodoList();
    const handlers = {
      onDone({todoItem}) {
        todoItem.done = !todoItem.done;
        fetch(`http://localhost:3000/api/todos/${todoItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify({done: todoItem.done}),
          headers: {
            'Content-Type': 'application/json',
          }
        });
      },
      onDelete({todoItem, element}) {
        if(!confirm('Вы уверены?')) {
          return
        }
        element.remove();
        fetch(`http://localhost:3000/api/todos/${todoItem.id}`, {
          method: 'DELETE'
        });
      }
    }

    container.append(todoAppTitle); // закидываем в container
    container.append(todoItemForm.form); // закидываем именно form, а не полностью все, ибо оно и так внутри
    container.append(todoList);

    // отправляем запрос на список всех дел
    const response = await fetch(`http://localhost:3000/api/todos?owner=${owner}`); // get запрос
    const todoItemList = await response.json();

    // преобразуем это в DOM
    todoItemList.forEach(todoItem => {
      const todoItemElement = createTodoItemElement(todoItem, handlers);
      todoList.append(todoItemElement);
    });

    // браузер создает событие submit на форме по нажатию на Enter или на кнопку создания дела
    // submit свойственно только элементу form
    todoItemForm.form.addEventListener('submit', async function(e) {
      // эта строчка необходима, чтобы предотвратить стандартные действия браузера
      // в данном случае мы не хоти, чтобы страница перезагружалась при отправке формы
      e.preventDefault();

      // игнорируем создание элемента, если пользователь ничего не ввёл в поле
      if (!todoItemForm.input.value) {
        return;
      }

// создаие запроса
      const response = await fetch('http://localhost:3000/api/todos', {
        method: 'POST',
        body: JSON.stringify({
          name: todoItemForm.input.value.trim(),
          owner,
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const todoItem = await response.json();

      const todoItemElement = createTodoItemElement(todoItem, handlers);

      // создаем и добавляем в список новое дело с названием из поля для ввода
      todoList.append(todoItemElement);

      todoItemForm.button.disabled = true;
      // обнуляем значение в поле, чтобы не пришлось стирать его вручную
      todoItemForm.input.value = '';
    });
  }

  window.createTodoApp = createTodoApp;
}) ();
