'use client'
import { ID, databases, storage } from '@/appwrite';
import Board from '@/components/Board';
import { getTodoGroupedByColumn } from '@/lib/getTodosGroupedByColumn';
import uploadImage from '@/lib/uploadImage';
import { create } from 'zustand'

interface BoardState{

setImage: any;
board: Board;
getBoard:()=> void;
setBoardState: (board:Board)=> void;
updateTodoInDB: (todo: Todo, columnId: TypedColumn)=>void;
newTaskInput:string;
newTaskType: TypedColumn;
image:File|null;

searchString: string;
setSearchString:(searchString:string)=>void;
addTask: (todo: string ,columnId:TypedColumn,image?:File|null)=>void;
deleteTask: (taskIndex:number, todoId: Todo, id: TypedColumn)=>void;
setNewTaskInput:(input:string)=>void;
setNewTaskType: (columnId:TypedColumn)=>void;
}

export const useBoardStore = create<BoardState>((set,get) => ({
  board:{
    columns: new Map<TypedColumn,Column>(),
  },
  searchString:"",
  newTaskInput:"",
  setSearchString:(searchString)=> set({searchString}),
  newTaskType:"todo",
  image:null,
  getBoard:async()=>{
const board = await getTodoGroupedByColumn();
set({board});

  },
  deleteTask: async (taskIndex:number,todo: Todo, id:TypedColumn)=>{
    const newColumns = new Map(get().board.columns);
    newColumns.get(id)?.todos.splice(taskIndex,1)
    set({board: {columns: newColumns}});
    if(todo.image){
      await storage.deleteFile(todo.image.bucketId,todo.image.fileId);
    }
    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      todo.$id
    )
  },
  setBoardState:(board)=>set({board}),
  
  setNewTaskInput: (input:string)=>set({newTaskInput:input}),
  setNewTaskType: (columnId:TypedColumn)=>set({newTaskType:columnId}),
  setImage: (image:File| null)=> set({image}),
  
  updateTodoInDB: async(todo,columnId)=>{
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      todo.$id,{
        title: todo.title,
        status: columnId,
      }
    )
  },

  addTask: async (todo:string,columnId: TypedColumn,image?:File|null)=>{
    let file: Image| undefined;
    if(image){
      const fileUploaded = await uploadImage(image);
      if(fileUploaded){
        file = {
          bucketId: fileUploaded.bucketId,
          fileId: fileUploaded.$id,
        };
      }
    }

    const {$id} = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      ID.unique(),
      {
        title: todo,
        status: columnId,
        ...(file && {image: JSON.stringify(file)}),

      }
    );

    set ({ newTaskInput:""});

    set ((state)=>{
      const newColumns = new Map(state.board.columns);
      const newTodo: Todo = {
        $id,
        $createdAt: new Date().toISOString(),
        title: todo,
        status: columnId,
        ...(file && {image:file}),
      };
      const column = newColumns.get(columnId);

      if(!column) {
        newColumns.set(columnId,{
          id:columnId,
          todos: [newTodo],
        });
      } else {
        newColumns.get(columnId)?.todos.push(newTodo);
      }
      return {
        board: {
          columns: newColumns,
        }
      }
    })

  }
 
}))