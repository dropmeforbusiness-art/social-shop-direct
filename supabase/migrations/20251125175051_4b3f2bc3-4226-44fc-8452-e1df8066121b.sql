-- Allow users to create their own seller profile during signup
CREATE POLICY "Users can create their own seller profile"
ON public.seller_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);