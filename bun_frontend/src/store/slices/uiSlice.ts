import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserPerspective = "creator" | "sponsor";

interface UIState {
    perspective: UserPerspective;
}

const initialState: UIState = {
    perspective: (localStorage.getItem("userPerspective") as UserPerspective) || "creator",
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setPerspective: (state, action: PayloadAction<UserPerspective>) => {
            state.perspective = action.payload;
            localStorage.setItem("userPerspective", action.payload);
        },
        togglePerspective: (state) => {
            state.perspective = state.perspective === "creator" ? "sponsor" : "creator";
            localStorage.setItem("userPerspective", state.perspective);
        },
    },
});

export const { setPerspective, togglePerspective } = uiSlice.actions;

export const selectPerspective = (state: { ui: UIState }) => state.ui.perspective;

export default uiSlice.reducer;
