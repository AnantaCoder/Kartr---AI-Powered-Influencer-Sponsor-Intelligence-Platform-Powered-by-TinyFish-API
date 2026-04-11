import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, selectIsAuthenticated } from "../../store/slices/authSlice";
import { setPerspective, selectPerspective } from "../../store/slices/uiSlice";

/**
 * PerspectiveSync
 * 
 * Synchronizes the UI perspective with the user's role after login.
 * guest users can toggle, but logged-in users are locked to their user_type.
 */
const PerspectiveSync: React.FC = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentPerspective = useSelector(selectPerspective);

    useEffect(() => {
        if (isAuthenticated && user) {
            const requiredPerspective = user.user_type === "influencer" ? "creator" : "sponsor";

            if (currentPerspective !== requiredPerspective) {
                dispatch(setPerspective(requiredPerspective));
            }
        }
    }, [isAuthenticated, user, currentPerspective, dispatch]);

    return null; // Side-effect only component
};

export default PerspectiveSync;
